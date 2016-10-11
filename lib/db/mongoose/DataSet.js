'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _mongoose2.default.model('DataSet', (0, _mongoose.Schema)({
  generatedDate: Date,
  forecastedDate: Date,
  layers: [{ type: _mongoose.Schema.Types.ObjectId, ref: 'Layer' }]
}));