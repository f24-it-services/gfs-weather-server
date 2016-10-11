'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bootstrap = bootstrap;
exports.disconnect = disconnect;

var _Config = require('../Config');

var _Config2 = _interopRequireDefault(_Config);

var _mongoose = require('./mongoose');

var _sequelize = require('./sequelize');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db = {};

exports.default = db;
function bootstrap() {
  switch (_Config2.default.get().db) {
    case 'mongoose':
      Object.assign(db, (0, _mongoose.bootstrap)());
      break;
    case 'sequelize':
      Object.assign(db, (0, _sequelize.bootstrap)());
      break;
  }

  return db;
}

function disconnect() {
  switch (_Config2.default.get().db) {
    case 'mongoose':
      return (0, _mongoose.disconnect)();
    case 'sequelize':
      return (0, _sequelize.disconnect)();
  }
}