import cron from 'node-cron'
import cp from 'child_process'
import path from 'path'
import { argv } from 'yargs'

import Config from './Config'
import { bootstrap, disconnect } from './db'

/**
 * @typedef {Object} argv
 * @property {String|Object} config - path to configuration
 * @property {String} [runOnce] - `download|cleanup`
 * @property {String} [date] - date to start with gfs data download - ISO format e.g. `2019-04-12T00:00:00Z`
 */

let config

// Setup configuration
if (argv.config) {
  config = require(path.resolve(argv.config))
} else {
  config = require(path.resolve(process.cwd(), 'config.json'))
}

Config.set(config)
bootstrap()

if (argv.runOnce) {
  runJob(argv.runOnce)
} else {
  Object.keys(config.crontab).forEach((name) => {
    const { schedule } = config.crontab[name]
    cron.schedule(schedule, () => runInChild(name))
  })
}

function runInChild (name) {
  const cmd = process.argv[0]
  const args = process.argv.slice(1)
  args.push('--run-once', name)

  console.log(`${new Date()} run ${cmd} ${args.join(' ')}`)
  cp.spawn(cmd, args, { stdio: 'inherit' })
}

function runJob (name) {
  const { options } = config.crontab[name]
  const fn = require(`./jobs/${name}`)

  return (fn.default || fn)(options)
    .then(disconnect)
    .catch(err => {
      console.error(err)
      disconnect()
    })
}
