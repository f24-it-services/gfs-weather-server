'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = download;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _gfsDownloader = require('gfs-downloader');

var _gfsWeatherUtils = require('gfs-weather-utils');

var _yargs = require('yargs');

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

var _FileSet = require('../util/FileSet');

var _FileSet2 = _interopRequireDefault(_FileSet);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('gfs.cron.downloader');

function download(options) {
  /**
   * Utility function to start the downloader process
   * @param  {Date} startDate
   * @return {Promise}
   */
  var start = function start(startDate) {
    var config = Object.assign({}, options, { fields: [] });
    options.fields.forEach(function (field) {
      if (typeof field.name === 'string') {
        config.fields.push(field);
      } else {
        config.fields.push.apply(config.fields, expandDescriptors(field));
      }
    });
    // config.client = new Client('http://mirror:9090/')
    return new _gfsDownloader.Downloader(config).update(startDate);
  };

  // Start the updated based on either the date given via CLI or the newest
  // previously loaded data set
  var promise = void 0;
  if (_yargs.argv.date) {
    // If a date is given via CLI, we look for a data set matching the given
    // day and hour
    var date = new Date(Date.parse(_yargs.argv.date));
    if (isNaN(date.getTime())) {
      return console.error('Invalid date ' + _yargs.argv.date); // eslint-disable-line no-console
    }
    promise = start(date);
  } else {
    //
    // Fetch the date of the latest update from the database. We use the
    // generated date here, i.e. the date the previously loaded forecast(s)
    // where updated by the GFS
    promise = _db2.default.query.findLatestGeneratedDate().then(function (date) {
      return start(null, date);
    });
  }

  //
  // If updated forecasts are found, create the new datasets first
  //
  return promise.then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var files = _ref2[0];
    var generatedDate = _ref2[1];

    if (files === null) {
      return debug('No new files found');
    }
    var dataSets = {};

    files.forEach(function (file) {
      if (!dataSets[file.forecast]) {
        dataSets[file.forecast] = [];
      }

      dataSets[file.forecast].push(file);
    });

    return (0, _gfsWeatherUtils.sequence)(Object.keys(dataSets).map(function (forecast) {
      return function () {
        debug('Creating dataset for date=' + generatedDate + ' forecast=' + forecast);
        var values = {
          generatedDate: generatedDate,
          forecastedDate: new Date(+generatedDate + forecast * 3600000)
        };
        return _db2.default.query.findOrUpsertDataSet(values).then(function (dataSet) {
          return [dataSet, new _FileSet2.default(dataSets[forecast])];
        });
      };
    }))
    //
    // After the datasets are created, we can run all the different layer
    // import and conversion tasks
    //
    .then(function (dataSets) {
      var tasks = [];

      dataSets.forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2);

        var dataSet = _ref4[0];
        var fileSet = _ref4[1];

        createTasks(tasks, dataSet, fileSet, options.fields);
      });

      return (0, _gfsWeatherUtils.sequence)(tasks, false);
    });
  });
}

function expandDescriptors(field) {
  var fields = [];
  field.name.forEach(function (name) {
    fields.push(Object.assign({}, field, { name: name }));
  });
  return fields;
}

function createTasks(tasks, dataSet, fileSet, fields) {
  fields.forEach(function (field) {
    if (Array.isArray(field.name)) {
      tasks.push(function () {
        return combineFields(field, dataSet, fileSet);
      });
    } else if (field.process && field.process[0] === 'to-regular') {
      tasks.push(function () {
        return convertGrid(field, dataSet, fileSet);
      });
    } else {
      tasks.push(function () {
        return importField(field, dataSet, fileSet);
      });
    }
  });
}

function importField(field, dataSet, fileSet) {
  return fileSet.select(field).then(function (grid) {
    debug('Write ' + field.name + ' to storage');
    return _db2.default.query.findOrUpsertLayer(dataSet, field, grid);
  });
}

function combineFields(field, dataSet, fileSet) {
  return fileSet.selectMany.apply(fileSet, expandDescriptors(field)).then(function (grids) {
    debug('Combine ' + field.name + ' to ' + field.combinedName);
    var descriptor = Object.assign({}, field, { name: field.combinedName });
    return _db2.default.query.findOrUpsertLayer(dataSet, descriptor, grids.combine());
  });
}

function convertGrid(field, dataSet, fileSet) {
  var args = field.process.slice(1);
  return fileSet.select(field).then(function (grid) {
    debug('Convert ' + field.name + ' to regular with ' + args);
    var regularGrid = grid.scaleToRegular.apply(grid, args);
    return _db2.default.query.findOrUpsertLayer(dataSet, field, regularGrid);
  });
}