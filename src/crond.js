import cron from 'node-cron'
import glob from 'glob'
import path from 'path'
import {argv} from 'yargs'

import Config from './Config'

// Setup configuration
let config
if (argv.config) config = require(path.resolve(argv.config))
else config = require(path.resolve(process.cwd(), 'config.json'))

Config.set(config)

if (argv.runOnce) {
  let fileName = path.join(__dirname, 'jobs', argv.runOnce)
  let install = require(fileName)
  ;(install.default || install)((pattern, taskFn) => taskFn())
} else {
  glob(path.join(__dirname, 'jobs', '*.js'), (err, res) => {
    if (err) return console.error(err)

    res.forEach((file) => {
      let install = require(file)
      ;(install.default || install)(
        (pattern, taskFn) => cron.schedule(pattern, taskFn)
      )
    })
  })
}
