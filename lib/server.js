'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _restify = require('restify');

var _restify2 = _interopRequireDefault(_restify);

var _yargs = require('yargs');

var _Config = require('./Config');

var _Config2 = _interopRequireDefault(_Config);

var _db = require('./db');

var _routes = require('./api/routes');

var routes = _interopRequireWildcard(_routes);

var _plugins = require('./api/plugins');

var _plugins2 = _interopRequireDefault(_plugins);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Setup configuration
var config = void 0;
if (_yargs.argv.config) config = require(_path2.default.resolve(_yargs.argv.config));else config = require(_path2.default.resolve(process.cwd(), 'config.json'));

_Config2.default.set(config);

// Bootstrap database
(0, _db.bootstrap)();

// Bootstrap restify
var server = _restify2.default.createServer({
  name: 'WG'
});
server.use(_restify2.default.queryParser());

// Register plugins
_plugins2.default.forEach(function (plugin) {
  return plugin(server);
});

// Register routes
Object.keys(routes).forEach(function (route) {
  return routes[route](server);
});

server.listen(config.server.port);