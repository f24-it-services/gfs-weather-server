import debugFactory from 'debug'
import {GridFactory, GridSet, sequence} from 'gfs-weather-utils'
import grib2json from 'grib2json'

const debug = debugFactory('gfs.fileset')

export default class FileSet {
  constructor (files) {
    this.files = files
  }

  selectMany (...descriptors) {
    return sequence(descriptors.map((d) => () => this.select(d)))
    .then((grids) => new GridSet(grids))
  }

  select (descriptor) {
    let file = this.findFile(descriptor)
    if (file) {
      return this.readFile(file).then(GridFactory.fromJSON)
    } else {
      return Promise.reject(
        new Error(`File not found: ${JSON.stringify(descriptor)}`)
      )
    }
  }

  findFile ({name, surface, date, forecast}) {
    return this.files.find((item) => {
      let matched = true
      if (name && name !== item.name) matched = false
      if (surface && surface !== item.surface) matched = false
      if (date && date.getTime() !== item.date.getTime()) matched = false
      if (forecast && date.forecast !== item.forecast) matched = false
      return matched
    })
  }

  readFile (file) {
    debug(`Attempt to read json name=${file.name}`)

    let gribOptions = {names: false, data: true}

    return new Promise((resolve, reject) => {
      debug(`Read ${file.file}`)
      grib2json(file.file, gribOptions, (err, data) => {
        if (err) return reject(err)
        resolve(data)
      })
    })
  }

  forEach (cb, ctx) {
    return this.files.forEach(cb, ctx)
  }
}
