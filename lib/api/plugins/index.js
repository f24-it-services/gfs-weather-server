'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _headers = require('./headers');

var _headers2 = _interopRequireDefault(_headers);

var _pbfFormatter = require('./pbfFormatter');

var _pbfFormatter2 = _interopRequireDefault(_pbfFormatter);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var plugins = [_headers2.default, _pbfFormatter2.default, _formatter2.default];

exports.default = plugins;