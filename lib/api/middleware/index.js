'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.forecast = forecast;
exports.layer = layer;
exports.cacheControl = cacheControl;
exports.sendBuffer = sendBuffer;
exports.sendErrorBuffer = sendErrorBuffer;
exports.sendJson = sendJson;
exports.sendError = sendError;

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

var EMPTY_GEOJSON_BUFFER = new Buffer(_geobuf2.default.encode({
  type: 'FeatureCollection',
  features: []
}, new _pbf2.default()), 'binary');

/**
 * express middleware for obtaining forecast data
 * requires `?layers=` as query parameter
 */
function forecast(req, res, next) {
  var layers = req.query.layers;
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

  var fromDate = new Date(parseInt(req.query.from));
  var lat = parseFloat(req.query.lat);
  var lng = parseFloat(req.query.lng);

  _Forecast2.default.fetch([lat, lng], layers, fromDate).then(function (result) {
    res.body = result;
    next();
  }, next);
}

/**
 * express middleware for obtaining a layer
 * requires `/:name/:date` in route URI
 */
function layer(req, res, next) {
  debug('Get layer name=' + req.params.name + ' date=' + req.params.date + ' bounds=' + req.query.bb);
  var forecastedDate = new Date(parseInt(req.params.date));
  var bounds = req.query.bb.split(',').map(function (c) {
    return parseFloat(c);
  });

  _GridLoader2.default.fetchGeoJSON(req.params.name, forecastedDate, bounds, parseInt(req.query.sf)).then(function (geoJSON) {
    res.body = geoJSON || {};
    next();
  }, function (err) {
    debug('error', err);
    next(err);
  });
}

function cacheControl(maxAge) {
  return function (req, res, next) {
    res.setHeader('Cache-Control', 'max-age=' + maxAge);
    next && next();
  };
}

function sendBuffer(req, res, next) {
  var buff = _geobuf2.default.encode(res.body, new _pbf2.default());
  res.setHeader('Content-Type', 'application/x-protobuf');
  res.send(new Buffer(buff, 'binary'));
  next && next();
}

function sendErrorBuffer(err, req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.setHeader('Content-Type', 'application/x-protobuf');
  res.status(404).send(EMPTY_GEOJSON_BUFFER);
  next && next(err);
}

function sendJson(req, res, next) {
  res.send(res.body);
  next && next();
}

function sendError(err, req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  res.status(404).send({});
  next && next(err);
}