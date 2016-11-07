'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _gfsWeatherUtils = require('gfs-weather-utils');

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var INTERVAL = 3;

exports.default = {
  fetch: function fetch(latlng, layers, startDate) {
    var _wrapLngLat = (0, _gfsWeatherUtils.wrapLngLat)([latlng[1], latlng[0]]);

    var _wrapLngLat2 = _slicedToArray(_wrapLngLat, 2);

    var lng = _wrapLngLat2[0];
    var lat = _wrapLngLat2[1];

    var la1 = (0, _gfsWeatherUtils.wrapLat)(Math.ceil(lat));
    var lo1 = (0, _gfsWeatherUtils.wrapLng)(Math.floor(lng));
    var la2 = (0, _gfsWeatherUtils.wrapLat)(Math.floor(lat));
    var lo2 = (0, _gfsWeatherUtils.wrapLng)(Math.ceil(lng));

    if (la1 === la2) la2 = (0, _gfsWeatherUtils.wrapLat)(la2 - 1);
    if (lo1 === lo2) lo2 = (0, _gfsWeatherUtils.wrapLng)(lo2 + 1);

    return _db2.default.query.findPointsByCoords({ forecastedDate: { $gte: startDate } }, { $or: layers }, [[lo1, la1], [lo2, la1], [lo1, la2], [lo2, la2]], false).then(function (dataSets) {
      var layerMap = {};
      var layerKey = function layerKey(layer) {
        return layer.name + ':' + layer.surface;
      };
      layers.forEach(function (layer) {
        layerMap[layerKey(layer)] = _extends({}, layer, {
          values: []
        });
      });

      dataSets.forEach(function (dataSet) {
        var offset = Math.floor((dataSet.forecastedDate.getTime() - startDate.getTime()) / (INTERVAL * 3600000));
        // Initialize all values at the current forecast offset with nulls
        layers.forEach(function (layer) {
          layerMap[layerKey(layer)].values[offset] = null;
        });
        // Set every value we received for the current offset to our layer map
        dataSet.layers.forEach(function (layer) {
          var data = [];
          layer.points.forEach(function (p) {
            var _p$lnglat$coordinates = _slicedToArray(p.lnglat.coordinates, 2);

            var lo = _p$lnglat$coordinates[0];
            var la = _p$lnglat$coordinates[1];

            var i = (la1 - la) * 2 + (lo - lo1);
            data[i] = p.value;
            // console.log(i, lo, la, p.value, lo1, la1)
          });
          var grid = new _gfsWeatherUtils.Grid(0, la1, lo1, 1, 1, 2, 2, data);
          // console.log(lng, lat)
          // console.log(grid.interpolateAt(lat, lng))
          layerMap[layerKey(layer)].values[offset] = grid.interpolateAt(lat, lng);
        });
      });

      return {
        start: startDate,
        interval: INTERVAL,
        position: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        layers: Object.keys(layerMap).map(function (key) {
          return layerMap[key];
        })
      };
    });
  },
  bulkFetch: function bulkFetch(coordinates, layers, startDate) {
    var _this = this;

    var result = {
      start: startDate,
      interval: 3,
      forecasts: []
    };

    return (0, _gfsWeatherUtils.sequence)(coordinates.map(function (coord) {
      return function () {
        return _this.fetch(coord.latlng, layers, startDate).then(function (forecast) {
          result.forecasts.push({
            id: coord.id,
            position: forecast.position,
            layers: forecast.layers
          });
        });
      };
    })).then(function () {
      return result;
    });
  }
};