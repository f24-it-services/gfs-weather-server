'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  fetchGeoJSON: function fetchGeoJSON(layerName, forecastedDate, bounds) {
    return _db2.default.query.findPointsInBounds({ forecastedDate: forecastedDate }, { name: layerName }, bounds, true).then(function (dataSet) {
      if (!dataSet || !dataSet.layers || dataSet.layers.length !== 1) {
        throw new Error('Can\'t find data for layer \'' + layerName + '\' at ' + forecastedDate + ' within ' + bounds);
      }

      return {
        type: 'FeatureCollection',
        features: dataSet.layers[0].points.map(function (point) {
          return {
            type: 'Feature',
            geometry: point.lnglat.toJSON(),
            properties: {
              value: point.value
            }
          };
        })
      };
    });
  }
};