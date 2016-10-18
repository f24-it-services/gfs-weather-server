'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dbStreamer = require('db-streamer');

var _dbStreamer2 = _interopRequireDefault(_dbStreamer);

var _Config = require('../../Config');

var _Config2 = _interopRequireDefault(_Config);

var _QueryInterface2 = require('../QueryInterface');

var _QueryInterface3 = _interopRequireDefault(_QueryInterface2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SequelizeQueryInterface = function (_QueryInterface) {
  _inherits(SequelizeQueryInterface, _QueryInterface);

  function SequelizeQueryInterface(db) {
    _classCallCheck(this, SequelizeQueryInterface);

    var _this = _possibleConstructorReturn(this, (SequelizeQueryInterface.__proto__ || Object.getPrototypeOf(SequelizeQueryInterface)).call(this));

    _this.db = db;
    return _this;
  }

  _createClass(SequelizeQueryInterface, [{
    key: 'findLatestGeneratedDate',
    value: function findLatestGeneratedDate() {
      return this.db.DataSet.findOne({
        order: [['generated_date', 'DESC']]
      }).then(function (dataSet) {
        return dataSet && dataSet.generatedDate;
      });
    }
  }, {
    key: 'findOrUpsertDataSet',
    value: function findOrUpsertDataSet(values) {
      return this.db.DataSet.findOrCreate({
        where: { forecastedDate: values.forecastedDate },
        defaults: values
      }).spread(function (dataSet, created) {
        if (created) {
          return dataSet;
        } else {
          return dataSet.updateAttributes(values);
        }
      });
    }
  }, {
    key: 'findOrUpsertLayer',
    value: function findOrUpsertLayer(dataSet, descriptor, grid) {
      var _this2 = this;

      var values = {
        data_set_id: dataSet.id,
        name: descriptor.name.toLowerCase(),
        surface: descriptor.surface
      };

      return this.db.Layer.findOrCreate({
        where: values,
        defaults: values
      }).spread(function (layer, created) {
        if (created) {
          return layer;
        } else {
          return layer.updateAttributes(values).then(function (layer) {
            return _this2.db.Point.destroy({
              where: { layer_id: layer.id }
            }).then(function () {
              return layer;
            });
          });
        }
      }).then(function (layer) {
        return _this2.createInserter('weather.points', ['layer_id', 'lnglat', 'value']).then(function (inserter) {
          return new Promise(function (resolve, reject) {
            grid.forEach(function (value, x, y) {
              if (!value) return;

              var _grid$lnglat = grid.lnglat(x, y);

              var _grid$lnglat2 = _slicedToArray(_grid$lnglat, 2);

              var lng = _grid$lnglat2[0];
              var lat = _grid$lnglat2[1];

              inserter.push({
                layer_id: layer.id,
                lnglat: 'SRID=4326;POINT(' + lng + ' ' + lat + ')',
                value: '{' + (value.join ? value.join(',') : value) + '}'
              });
            });

            inserter.setEndHandler(function (err) {
              if (err) return reject(err);
              resolve();
            });

            inserter.end();
          });
        });
      });
    }
  }, {
    key: 'createInserter',
    value: function createInserter(table, columns) {
      var config = _Config2.default.get().sequelize;
      var connString = config.options.dialect + '://' + config.user + ':' + config.password + '@' + config.options.host + ':' + config.options.port + '/' + config.database;

      return new Promise(function (resolve, reject) {
        var inserter = _dbStreamer2.default.getInserter({
          dbConnString: connString,
          tableName: table,
          columns: columns
        });

        inserter.connect(function (err) {
          if (err) return reject(err);
          resolve(inserter);
        });
      });
    }
  }, {
    key: 'findPointsInBounds',
    value: function findPointsInBounds(dsCriteria, layerCriteria, bounds) {
      var fetchOne = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var _bounds = _slicedToArray(bounds, 4);

      var swLng = _bounds[0];
      var swLat = _bounds[1];
      var neLng = _bounds[2];
      var neLat = _bounds[3];


      var query = {
        where: dsCriteria,
        include: [{
          model: this.db.Layer,
          as: 'layers',
          where: layerCriteria,
          include: [{
            model: this.db.Point,
            as: 'points',
            where: ['lnglat && ?::geography', ['POLYGON((' + swLng + ' ' + swLat + ',' + swLng + ' ' + neLat + ',' + neLng + ' ' + neLat + ',' + neLng + ' ' + swLat + ',' + swLng + ' ' + swLat + '))']]
          }]
        }],
        order: [['forecastedDate', 'ASC']]
      };

      return fetchOne ? this.db.DataSet.find(query) : this.db.DataSet.findAll(query);
    }
  }, {
    key: 'findPointsByCoords',
    value: function findPointsByCoords(dsCriteria, layerCriteria, points) {
      var fetchOne = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var pointsList = points.map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var lng = _ref2[0];
        var lat = _ref2[1];
        return '(' + lng + ' ' + lat + ')';
      }).join(',');

      var query = {
        where: dsCriteria,
        include: [{
          model: this.db.Layer,
          as: 'layers',
          where: layerCriteria,
          include: [{
            model: this.db.Point,
            as: 'points',
            where: ['lnglat @ ?::geometry', ['MULTIPOINT(' + pointsList + ')']]
          }]
        }],
        order: [['forecastedDate', 'ASC']]
      };

      return fetchOne ? this.db.DataSet.find(query) : this.db.DataSet.findAll(query);
    }
  }]);

  return SequelizeQueryInterface;
}(_QueryInterface3.default);

exports.default = SequelizeQueryInterface;