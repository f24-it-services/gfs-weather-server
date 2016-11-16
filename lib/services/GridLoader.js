'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gfsWeatherUtils = require('gfs-weather-utils');

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  fetchGeoJSON: function fetchGeoJSON(layerName, forecastedDate, bounds, sampleFactor) {
    bounds[0] = (0, _gfsWeatherUtils.wrapLng)(bounds[0]);
    bounds[1] = (0, _gfsWeatherUtils.wrapLat)(bounds[1]);
    bounds[2] = (0, _gfsWeatherUtils.wrapLng)(bounds[2]);
    bounds[3] = (0, _gfsWeatherUtils.wrapLat)(bounds[3]);

    return _db2.default.query.findGrid({ forecastedDate: forecastedDate }, { name: layerName }, bounds, sampleFactor).then(function (grid) {
      var features = grid.points.map(function (point) {
        return {
          type: 'Feature',
          geometry: point.lnglat.toJSON ? point.lnglat.toJSON() : point.lnglat,
          properties: {
            value: point.value
          }
        };
      });
      features.unshift({
        type: 'Feature',
        geometry: [0, 0],
        properties: {
          dx: grid.dx,
          dy: grid.dy,
          bounds: grid.bounds
        }
      });
      return {
        type: 'FeatureCollection',
        features: features
      };
    });

    // return db.query.findPointsInBounds({forecastedDate}, {name: layerName}, bounds, true)
    // .then((dataSet) => {
    //   if (!dataSet || !dataSet.layers || dataSet.layers.length !== 1) {
    //     throw new Error(`Can't find data for layer '${layerName}' at ${forecastedDate} within ${bounds}`)
    //   }
    //
    //   return {
    //     type: 'FeatureCollection',
    //     features: dataSet.layers[0].points.map((point) => ({
    //       type: 'Feature',
    //       geometry: point.lnglat.toJSON ? point.lnglat.toJSON() : point.lnglat,
    //       properties: {
    //         value: point.value
    //       }
    //     }))
    //   }
    // })
  }
};