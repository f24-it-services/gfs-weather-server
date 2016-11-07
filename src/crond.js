import cron from 'node-cron'
import {argv} from 'yargs'
import cp from 'child_process'
import path from 'path'

import Config from './Config'
import {bootstrap, disconnect} from './db'

// Setup configuration
let config
if (argv.config) config = require(path.resolve(argv.config))
else config = require(path.resolve(process.cwd(), 'config.json'))

Config.set(config)
bootstrap()

if (argv.runOnce) {
  runJob(argv.runOnce)
} else {
  Object.keys(config.crontab).forEach((name) => {
    let {schedule} = config.crontab[name]
    cron.schedule(schedule, () => runInChild(name))
  })
}

function runInChild (name) {
  let cmd = process.argv[0]
  let args = process.argv.slice(1)
  args.push('--run-once', name)

  console.log(`${new Date()} run ${cmd} ${args.join(' ')}`)
  cp.spawn(cmd, args, {stdio: 'inherit'})
}

function runJob (name) {
  let {options} = config.crontab[name]
  let fn = require(`./jobs/${name}`)

  return (fn.default || fn)(options).then(disconnect, (err) => {
    console.error(err)
    disconnect()
  })
}
