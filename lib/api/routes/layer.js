'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = attach;

var _pbf = require('pbf');

var _pbf2 = _interopRequireDefault(_pbf);

var _geobuf = require('geobuf');

var _geobuf2 = _interopRequireDefault(_geobuf);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _Forecast = require('../../services/Forecast');

var _Forecast2 = _interopRequireDefault(_Forecast);

var _GridLoader = require('../../services/GridLoader');

var _GridLoader2 = _interopRequireDefault(_GridLoader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('gfs.server');

// FIXME move to shared library
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function attach(server) {
  // FIXME move to separate route file
  server.get('/forecast', function (req, res, next) {
    var layers = req.params.layers;

    if (!Array.isArray(layers)) {
      layers = [layers];
    }

    layers = layers.map(function (layer) {
      var _layer$split = layer.split('@');

      var _layer$split2 = _slicedToArray(_layer$split, 2);

      var name = _layer$split2[0];
      var surface = _layer$split2[1];

      return { name: name, surface: surface };
    });

    var fromDate = new Date(parseInt(req.params.from));
    var lat = clamp(req.params.lat, -90, 90);
    var lng = clamp(req.params.lng, -180, 180);

    _Forecast2.default.fetch([lat, lng], layers, fromDate).then(function (result) {
      res.send(result);
      next();
    }, next);
  });

  server.get('/layer/:name/:date?:bb', function (req, res, next) {
    debug('Get layer name=' + req.params.name + ' date=' + req.params.date + ' bounds=' + req.params.bb);
    var forecastedDate = new Date(parseInt(req.params.date));
    var bounds = req.params.bb.split(',').map(function (c) {
      return parseFloat(c);
    });
    bounds = [bounds[1], bounds[2], bounds[3], bounds[0]];

    _GridLoader2.default.fetchGeoJSON(req.params.name, forecastedDate, bounds).then(function (geoJSON) {
      res.setHeader('content-type', 'application/x-protobuf');
      res.send(_geobuf2.default.encode(geoJSON, new _pbf2.default()));
      next();
    }, function (err) {
      debug('error', err);
      next(err);
    });
  });
}