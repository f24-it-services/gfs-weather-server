'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize, DataTypes) {
  return sequelize.define('Point', {
    lnglat: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    },
    value: {
      type: DataTypes.ARRAY(DataTypes.DOUBLE),
      allowNull: false
    }
  }, Object.assign({}, _Config2.default.get().sequelize.modelOptions, {
    tableName: 'points',
    timestamps: false,
    indexes: [{
      fields: ['lnglat'],
      using: 'gist'
    }]
  }));
};

var _Config = require('../../Config');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }