'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = attach;

var _middleware = require('../middleware');

var CACHE_CONTROL_MAX_AGE = 3 * 3600; // 3hours

function attach(server) {
  server.get('/forecast', _middleware.forecast, (0, _middleware.cacheControl)(CACHE_CONTROL_MAX_AGE), _middleware.sendJson, _middleware.sendError);

  server.get('/layer/:name/:date', _middleware.layer, (0, _middleware.cacheControl)(CACHE_CONTROL_MAX_AGE), _middleware.sendBuffer, _middleware.sendErrorBuffer);
}