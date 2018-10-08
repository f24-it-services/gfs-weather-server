import fs from 'fs'
import path from 'path'
import debugFactory from 'debug'

import db from '../db'

const debug = debugFactory('gfs.cron.cleanup')

export default function cleanup (options) {
  let { fileTTL, dataSetTTL, downloaderTarget } = options
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
  return db.query.cleanupOldDataSets(dataSetTTL)
}
