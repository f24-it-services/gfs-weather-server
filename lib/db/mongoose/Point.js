'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pointSchema = (0, _mongoose.Schema)({
  layer: { type: _mongoose.Schema.Types.ObjectId, ref: 'Layer' },
  lnglat: {
    type: { type: String },
    coordinates: [Number]
  },
  value: [Number]
});
pointSchema.index({ layer: 1, lnglat: '2dsphere' });

exports.default = _mongoose2.default.model('Point', pointSchema);