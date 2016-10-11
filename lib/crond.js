'use strict';

var _nodeCron = require('node-cron');

var _nodeCron2 = _interopRequireDefault(_nodeCron);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _yargs = require('yargs');

var _Config = require('./Config');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Setup configuration
var config = void 0;
if (_yargs.argv.config) config = require(_path2.default.resolve(_yargs.argv.config));else config = require(_path2.default.resolve(process.cwd(), 'config.json'));

_Config2.default.set(config);

if (_yargs.argv.runOnce) {
  var fileName = _path2.default.join(__dirname, 'jobs', _yargs.argv.runOnce);
  var install = require(fileName);(install.default || install)(function (pattern, taskFn) {
    return taskFn();
  });
} else {
  (0, _glob2.default)(_path2.default.join(__dirname, 'jobs', '*.js'), function (err, res) {
    if (err) return console.error(err);

    res.forEach(function (file) {
      var install = require(file);(install.default || install)(function (pattern, taskFn) {
        return _nodeCron2.default.schedule(pattern, taskFn);
      });
    });
  });
}