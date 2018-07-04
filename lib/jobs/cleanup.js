'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cleanup;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('gfs.cron.cleanup');

function cleanup(options) {
  var fileTTL = options.fileTTL,
      dataSetTTL = options.dataSetTTL,
      downloaderTarget = options.downloaderTarget;

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
  return _db2.default.query.cleanupOldDataSets(dataSetTTL);
}