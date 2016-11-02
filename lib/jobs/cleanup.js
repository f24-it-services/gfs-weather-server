'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = install;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _gfsWeatherUtils = require('gfs-weather-utils');

var _yargs = require('yargs');

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

var _Config = require('../Config');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('gfs.cron.cleanup');
var cronConfig = {};

function install(schedule) {
  cronConfig = _Config2.default.get().cleanup;

  schedule(cronConfig.schedule, function () {
    (0, _db.bootstrap)();

    var downloaderTarget = _Config2.default.get().downloader.target;
    var _cronConfig = cronConfig,
        fileTTL = _cronConfig.fileTTL,
        dataSetTTL = _cronConfig.dataSetTTL;

    var now = Date.now();

    // Cleanup old downloaded files to free some disk space
    _fs2.default.readdirSync(downloaderTarget).forEach(function (file) {
      var filePath = _path2.default.join(downloaderTarget, file);
      var stat = _fs2.default.statSync(filePath);
      if (now - stat.mtime.getTime() > fileTTL) {
        debug('unlink ' + filePath);
        _fs2.default.unlinkSync(filePath);
      }
    });

    // Cleanup old datasets
    _db2.default.query.cleanupOldDataSets(dataSetTTL)
    //
    // All done, catch errors and/or shutdown
    //
    .then(_db.disconnect, function (err) {
      console.error(err); // eslint-disable-line no-console
      (0, _db.disconnect)();
    });
  });
}