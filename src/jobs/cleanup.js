import fs from 'fs'
import path from 'path'
import debugFactory from 'debug'
import {sequence} from 'gfs-weather-utils'
import {argv} from 'yargs'

import db, {bootstrap, disconnect} from '../db'
import Config from '../Config'

const debug = debugFactory('gfs.cron.cleanup')
let cronConfig = {}

export default function install (schedule) {
  cronConfig = Config.get().cleanup

  schedule(cronConfig.schedule, () => {
    bootstrap()

    let downloaderTarget = Config.get().downloader.target
    let {fileTTL, dataSetTTL} = cronConfig
    let now = Date.now()

    // Cleanup old downloaded files to free some disk space
    fs.readdirSync(downloaderTarget)
    .forEach((file) => {
      let filePath = path.join(downloaderTarget, file)
      let stat = fs.statSync(filePath)
      if ((now - stat.mtime.getTime()) > fileTTL) {
        debug(`unlink ${filePath}`)
        fs.unlinkSync(filePath)
      }
    })

    // Cleanup old datasets
    db.query.cleanupOldDataSets(dataSetTTL)
    //
    // All done, catch errors and/or shutdown
    //
    .then(disconnect, (err) => {
      console.error(err) // eslint-disable-line no-console
      disconnect()
    })
  })
}
