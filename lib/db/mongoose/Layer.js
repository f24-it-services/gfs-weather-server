'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _mongoose2.default.model('Layer', (0, _mongoose.Schema)({
  dataSet: { type: _mongoose.Schema.Types.ObjectId, ref: 'DataSet' },
  name: 'string',
  surface: 'string'
}));