'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bootstrap = bootstrap;
exports.disconnect = disconnect;

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _Config = require('../../Config');

var _Config2 = _interopRequireDefault(_Config);

var _QueryInterface = require('./QueryInterface');

var _QueryInterface2 = _interopRequireDefault(_QueryInterface);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db = {};

exports.default = db;
function bootstrap() {
  var config = _Config2.default.get().sequelize;

  db.sequelize = config.sequelize || new _sequelize2.default(config.database, config.user, config.password, config.options);

  'DataSet Layer Point'.split(' ').forEach(function (file) {
    var model = db.sequelize.import('./' + file);
    db[model.name] = model;
  });

  db.DataSet.hasMany(db.Layer, { as: 'layers' });
  db.Layer.hasMany(db.Point, { as: 'points' });

  db.query = new _QueryInterface2.default(db);

  return db;
}

function disconnect() {
  return db.sequelize.close();
}