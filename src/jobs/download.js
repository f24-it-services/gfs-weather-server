import debugFactory from 'debug'
import {Downloader} from 'gfs-downloader'
import {sequence} from 'gfs-weather-utils'
import {argv} from 'yargs'

import db, {bootstrap, disconnect} from '../db'
import FileSet from '../util/FileSet'
import Config from '../Config'

const debug = debugFactory('gfs.cron.downloader')
let downloaderConfig = {}

export default function install (schedule) {
  schedule('* * * * *', () => {
    bootstrap()
    downloaderConfig = Config.get().downloader

    /**
     * Utility function to start the downloader process
     * @param  {Date} startDate
     * @return {Promise}
     */
    let start = (startDate) => {
      const config = Object.assign({}, downloaderConfig, {fields: []})
      downloaderConfig.fields.forEach((field) => {
        if (typeof field.name === 'string') {
          config.fields.push(field)
        } else {
          config.fields.push.apply(config.fields, expandDescriptors(field))
        }
      })
      // config.client = new Client('http://mirror:9090/')
      return new Downloader(config).update(startDate)
    }

    // Start the updated based on either the date given via CLI or the newest
    // previously loaded data set
    let promise
    if (argv.date) {
      // If a date is given via CLI, we look for a data set matching the given
      // day and hour
      let date = new Date(Date.parse(argv.date))
      if (isNaN(date.getTime())) {
        return console.error(`Invalid date ${argv.date}`) // eslint-disable-line no-console
      }
      promise = start(date)
    } else {
      //
      // Fetch the date of the latest update from the database. We use the
      // generated date here, i.e. the date the previously loaded forecast(s)
      // where updated by the GFS
      promise = db.query.findLatestGeneratedDate()
      .then((date) => {
        return start(null, date)
      })
    }

    //
    // If updated forecasts are found, create the new datasets first
    //
    promise.then(([files, generatedDate]) => {
      if (files === null) {
        return debug('No new files found')
      }
      let dataSets = {}

      files.forEach((file) => {
        if (!dataSets[file.forecast]) {
          dataSets[file.forecast] = []
        }

        dataSets[file.forecast].push(file)
      })

      return sequence(Object.keys(dataSets).map((forecast) => () => {
        debug(`Creating dataset for date=${generatedDate} forecast=${forecast}`)
        let values = {
          generatedDate,
          forecastedDate: new Date(+generatedDate + forecast * 3600000)
        }
        return db.query.findOrUpsertDataSet(values)
        .then((dataSet) => {
          return [dataSet, new FileSet(dataSets[forecast])]
        })
      }))
      //
      // After the datasets are created, we can run all the different layer
      // import and conversion tasks
      //
      .then((dataSets) => {
        let tasks = []

        dataSets.forEach(([dataSet, fileSet]) => {
          createTasks(tasks, dataSet, fileSet)
        })

        return sequence(tasks, false)
      })
    })
    //
    // All done, catch errors and/or shutdown
    //
    .then(disconnect, (err) => {
      console.error(err) // eslint-disable-line no-console
      disconnect()
    })
  })
}

function expandDescriptors (field) {
  let fields = []
  field.name.forEach((name) => {
    fields.push(Object.assign({}, field, {name}))
  })
  return fields
}

function createTasks (tasks, dataSet, fileSet) {
  downloaderConfig.fields.forEach((field) => {
    if (Array.isArray(field.name)) {
      tasks.push(() => combineFields(field, dataSet, fileSet))
    } else if (field.process && field.process[0] === 'to-regular') {
      tasks.push(() => convertGrid(field, dataSet, fileSet))
    } else {
      tasks.push(() => importField(field, dataSet, fileSet))
    }
  })
}

function importField (field, dataSet, fileSet) {
  return fileSet.select(field).then((grid) => {
    debug(`Write ${field.name} to storage`)
    return db.query.findOrUpsertLayer(dataSet, field, grid)
  })
}

function combineFields (field, dataSet, fileSet) {
  return fileSet.selectMany.apply(fileSet, expandDescriptors(field))
  .then((grids) => {
    debug(`Combine ${field.name} to ${field.combinedName}`)
    const descriptor = Object.assign({}, field, {name: field.combinedName})
    return db.query.findOrUpsertLayer(dataSet, descriptor, grids.combine())
  })
}

function convertGrid (field, dataSet, fileSet) {
  let args = field.process.slice(1)
  return fileSet.select(field).then((grid) => {
    debug(`Convert ${field.name} to regular with ${args}`)
    let regularGrid = grid.scaleToRegular.apply(grid, args)
    return db.query.findOrUpsertLayer(dataSet, field, regularGrid)
  })
}
