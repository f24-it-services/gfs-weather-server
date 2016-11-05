'use strict';

var _nodeCron = require('node-cron');

var _nodeCron2 = _interopRequireDefault(_nodeCron);

var _yargs = require('yargs');

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Config = require('./Config');

var _Config2 = _interopRequireDefault(_Config);

var _db = require('./db');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Setup configuration
var config = void 0;
if (_yargs.argv.config) config = require(_path2.default.resolve(_yargs.argv.config));else config = require(_path2.default.resolve(process.cwd(), 'config.json'));

_Config2.default.set(config);
(0, _db.bootstrap)();

if (_yargs.argv.runOnce) {
  runJob(_yargs.argv.runOnce);
} else {
  Object.keys(config.crontab).forEach(function (name) {
    var schedule = config.crontab[name].schedule;

    _nodeCron2.default.schedule(schedule, function () {
      return runInChild(name);
    });
  });
}

function runInChild(name) {
  var cmd = process.argv[0];
  var args = process.argv.slice(1);
  args.push('--run-once', name);

  console.log(new Date() + ' run ' + cmd + ' ' + args.join(' '));
  _child_process2.default.spawn(cmd, args, { stdio: 'inherit' });
}

function runJob(name) {
  var options = config.crontab[name].options;

  var fn = require('../src/jobs/' + name);

  return (fn.default || fn)(options).then(_db.disconnect, function (err) {
    console.error(err);
    (0, _db.disconnect)();
  });
}