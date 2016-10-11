'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _gfsWeatherUtils = require('gfs-weather-utils');

var _grib2json = require('grib2json');

var _grib2json2 = _interopRequireDefault(_grib2json);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('gfs.fileset');

var FileSet = function () {
  function FileSet(files) {
    _classCallCheck(this, FileSet);

    this.files = files;
  }

  _createClass(FileSet, [{
    key: 'selectMany',
    value: function selectMany() {
      var _this = this;

      for (var _len = arguments.length, descriptors = Array(_len), _key = 0; _key < _len; _key++) {
        descriptors[_key] = arguments[_key];
      }

      return (0, _gfsWeatherUtils.sequence)(descriptors.map(function (d) {
        return function () {
          return _this.select(d);
        };
      })).then(function (grids) {
        return new _gfsWeatherUtils.GridSet(grids);
      });
    }
  }, {
    key: 'select',
    value: function select(descriptor) {
      var file = this.findFile(descriptor);
      if (file) {
        return this.readFile(file).then(_gfsWeatherUtils.GridFactory.fromJSON);
      } else {
        return Promise.reject(new Error('File not found: ' + JSON.stringify(descriptor)));
      }
    }
  }, {
    key: 'findFile',
    value: function findFile(_ref) {
      var name = _ref.name;
      var surface = _ref.surface;
      var date = _ref.date;
      var forecast = _ref.forecast;

      return this.files.find(function (item) {
        var matched = true;
        if (name && name !== item.name) matched = false;
        if (surface && surface !== item.surface) matched = false;
        if (date && date.getTime() !== item.date.getTime()) matched = false;
        if (forecast && date.forecast !== item.forecast) matched = false;
        return matched;
      });
    }
  }, {
    key: 'readFile',
    value: function readFile(file) {
      debug('Attempt to read json name=' + file.name);

      var gribOptions = { names: false, data: true };

      return new Promise(function (resolve, reject) {
        debug('Read ' + file.file);
        (0, _grib2json2.default)(file.file, gribOptions, function (err, data) {
          if (err) return reject(err);
          resolve(data);
        });
      });
    }
  }, {
    key: 'forEach',
    value: function forEach(cb, ctx) {
      return this.files.forEach(cb, ctx);
    }
  }]);

  return FileSet;
}();

exports.default = FileSet;