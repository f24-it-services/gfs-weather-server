'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  return sequelize.define('Layer', {
    data_set_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'layers_unique_idx'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'layers_unique_idx'
    },
    surface: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'layers_unique_idx'
    }
  }, Object.assign({}, _Config2.default.get().sequelize.modelOptions, {
    tableName: 'layers'
  }));
};

var _Config = require('../../Config');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }