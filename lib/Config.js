'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var config = void 0;

exports.default = {
  get: function get() {
    if (!config) {
      throw new Error('Missing configuration. Call Config.set() to properly intialize');
    }
    return config;
  },
  set: function set(newConfig) {
    if (config) {
      throw new Error('Configuration already set.');
    }
    config = newConfig;
  },
  initialized: function initialized() {
    return !!config;
  }
};