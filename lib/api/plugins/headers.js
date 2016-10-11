'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = headers;

var _restify = require('restify');

function headers(server) {
  server.use((0, _restify.CORS)());
}