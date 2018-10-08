import path from 'path'
import restify from 'restify'
import { argv } from 'yargs'

import Config from './Config'
import { bootstrap } from './db'
import * as routes from './api/routes'
import plugins from './api/plugins'

// Setup configuration
let config
if (argv.config) config = require(path.resolve(argv.config))
else config = require(path.resolve(process.cwd(), 'config.json'))

Config.set(config)

// Bootstrap database
bootstrap()

// Bootstrap restify
const server = restify.createServer({
  name: 'WG'
})
server.use(restify.queryParser())

// Register plugins
plugins.forEach((plugin) => plugin(server))

// Register routes
Object.keys(routes).forEach(
  (route) => routes[route](server)
)

server.listen(config.server.port)
