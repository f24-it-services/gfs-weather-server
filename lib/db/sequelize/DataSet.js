'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  return sequelize.define('DataSet', {
    generatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'generated_date'
    },
    forecastedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'forecasted_date',
      unique: true
    }
  }, Object.assign({}, _Config2.default.get().sequelize.modelOptions, {
    tableName: 'datasets'
  }));
};

var _Config = require('../../Config');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }