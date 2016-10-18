'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bootstrap = bootstrap;
exports.disconnect = disconnect;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _Config = require('../../Config');

var _Config2 = _interopRequireDefault(_Config);

var _DataSet = require('./DataSet');

var _DataSet2 = _interopRequireDefault(_DataSet);

var _Layer = require('./Layer');

var _Layer2 = _interopRequireDefault(_Layer);

var _Point = require('./Point');

var _Point2 = _interopRequireDefault(_Point);

var _QueryInterface = require('./QueryInterface');

var _QueryInterface2 = _interopRequireDefault(_QueryInterface);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db = { DataSet: _DataSet2.default, Layer: _Layer2.default, Point: _Point2.default };

exports.default = db;
function bootstrap(connected) {
  var config = _Config2.default.get().mongoose;

  // Bootstrap mongoose
  // http://mongoosejs.com/docs/promises.html
  _mongoose2.default.Promise = global.Promise;
  !connected && _mongoose2.default.connect(config.connString);

  db.query = new _QueryInterface2.default(db);

  return db;
}

function disconnect() {
  return _mongoose2.default.disconnect();
}