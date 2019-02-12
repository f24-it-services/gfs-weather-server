'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _QueryInterface2 = require('../QueryInterface');

var _QueryInterface3 = _interopRequireDefault(_QueryInterface2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MongooseQueryInterface = function (_QueryInterface) {
  _inherits(MongooseQueryInterface, _QueryInterface);

  function MongooseQueryInterface(db) {
    _classCallCheck(this, MongooseQueryInterface);

    var _this = _possibleConstructorReturn(this, (MongooseQueryInterface.__proto__ || Object.getPrototypeOf(MongooseQueryInterface)).call(this));

    _this.db = db;
    return _this;
  }

  _createClass(MongooseQueryInterface, [{
    key: 'findLatestGeneratedDate',
    value: function findLatestGeneratedDate() {
      return this.db.DataSet.findOne().sort({ generatedDate: -1 }).then(function (res) {
        return res && res.generatedDate;
      });
    }
  }, {
    key: 'findOrUpsertDataSet',
    value: function findOrUpsertDataSet(values) {
      return this.db.DataSet.findOneAndUpdate({ forecastedDate: values.forecastedDate }, values, { upsert: true, new: true });
    }
  }, {
    key: 'findOrUpsertLayer',
    value: function findOrUpsertLayer(dataSet, descriptor, grid) {
      var _this2 = this;

      var values = {
        dataSet: dataSet._id,
        name: descriptor.name.toLowerCase(),
        surface: descriptor.surface
      };

      return new Promise(function (resolve, reject) {
        _this2.db.Layer.findOneAndUpdate(values, values, { upsert: true, new: true, passRawResult: true }, function (err, layer, res) {
          if (err) return reject(err);
          if (res && res.lastErrorObject && res.lastErrorObject.updatedExisting) {
            resolve(layer);
          } else {
            dataSet.layers.push(layer);
            dataSet.save(function (err, res) {
              if (err) return reject(err);
              resolve(layer);
            });
          }
        });
      }).then(function (layer) {
        return _this2.db.Point.deleteOne({ layer: layer._id }).then(function () {
          return layer;
        });
      }).then(function (layer) {
        return _this2.db.Point.collection.insertMany(grid.map(function (value, x, y) {
          return {
            layer: layer._id,
            lnglat: { type: 'Point', coordinates: grid.lnglat(x, y) },
            value: value
          };
        }));
      });
    }
  }, {
    key: '__populatePoints',
    value: function __populatePoints(dataSets, criteria) {
      var map = {};

      if (dataSets === null) {
        return [];
      }

      ;(Array.isArray(dataSets) ? dataSets : [dataSets]).forEach(function (dataSet) {
        return dataSet.layers.forEach(function (layer) {
          map[layer._id] = layer;
          layer.points = [];
        });
      });

      var withLayers = void 0;
      if (Array.isArray(criteria)) {
        withLayers = {
          $or: criteria.map(function (c) {
            return {
              layer: { $in: Object.keys(map) },
              lnglat: c
            };
          })
        };
      } else {
        withLayers = {
          layer: { $in: Object.keys(map) },
          lnglat: criteria
        };
      }

      return this.db.Point.find(withLayers).then(function (points) {
        points.forEach(function (point) {
          var layer = map[point.layer];
          if (!layer.points) layer.points = [];
          layer.points.push(point);
        });
        return dataSets;
      });
    }
  }, {
    key: '__findPoints',
    value: function __findPoints(dsCriteria, layerCriteria, pointCriteria) {
      var _this3 = this;

      var fetchOne = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      return (fetchOne ? this.db.DataSet.findOne(dsCriteria) : this.db.DataSet.find(dsCriteria)).populate({
        path: 'layers',
        match: layerCriteria
      }).sort({ forecastedDate: 1 }).then(function (dataSets) {
        return _this3.__populatePoints(dataSets, pointCriteria);
      });
    }
  }, {
    key: 'findGrid',
    value: function findGrid(dsCriteria, layerCriteria, bounds, sampleFactor) {
      var _this4 = this;

      var _bounds = _slicedToArray(bounds, 4),
          nwLng = _bounds[0],
          nwLat = _bounds[1],
          seLng = _bounds[2],
          seLat = _bounds[3];

      if (seLng - nwLng >= 360) {
        // Edge case where the bounding box covers the whole globe
        nwLng = -180;
        seLng = 180;
      }

      return this.db.DataSet.findOne(dsCriteria).populate({
        path: 'layers',
        match: layerCriteria
      }).sort({ forecastedDate: 1 }).then(function (dataSet) {
        if (!dataSet || !dataSet.layers || !dataSet.layers[0]) throw new Error('no DataSet found');
        return dataSet.layers[0];
      }).then(function (layer) {
        var query = void 0;

        if (nwLng > 0 && seLng < 0) {
          // Bounding box goes over dateline, need to split into two boxes
          query = {
            $or: [{
              layer: layer._id,
              lnglat: _this4.__withinBounds(nwLng, nwLat, 180, seLat)
            }, {
              layer: layer._id,
              lnglat: _this4.__withinBounds(-180, nwLat, seLng, seLat)
            }]
          };
        } else {
          query = {
            layer: layer._id,
            lnglat: _this4.__withinBounds(nwLng, nwLat, seLng, seLat)
          };
        }

        return _this4.db.Point.find(_extends({}, query, {
          $and: [{ 'lnglat.coordinates.0': { $mod: [sampleFactor, 0] } }, { 'lnglat.coordinates.1': { $mod: [sampleFactor, 0] } }]
        }));
      }).then(function (points) {
        return {
          dx: sampleFactor,
          dy: sampleFactor,
          bounds: [nwLng, nwLat, seLng, seLat],
          points: points
        };
      });
    }
  }, {
    key: '__withinBounds',
    value: function __withinBounds(nwLng, nwLat, seLng, seLat) {
      return {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[[nwLng, nwLat], [nwLng, seLat], [seLng, seLat], [seLng, nwLat], [nwLng, nwLat]]],
            crs: {
              type: 'name',
              properties: {
                name: 'urn:x-mongodb:crs:strictwinding:EPSG:4326'
              }
            }
          }
        }
      };
    }
  }, {
    key: 'findPointsByCoords',
    value: function findPointsByCoords(dsCriteria, layerCriteria, points) {
      var fetchOne = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      var pointCriteria = points.map(function (coords) {
        return {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: coords
            }
          }
        };
      });

      return this.__findPoints(dsCriteria, layerCriteria, pointCriteria, fetchOne);
    }
  }, {
    key: 'cleanupOldDataSets',
    value: function cleanupOldDataSets(ttl) {
      var _this5 = this;

      return this.db.DataSet.find({
        forecastedDate: { $lte: new Date(Date.now() - ttl) }
      }).populate('layers').then(function (dataSets) {
        if (!dataSets) return;

        var layerIds = [];
        var dsIds = [];
        dataSets.forEach(function (dataSet) {
          dsIds.push(dataSet._id);
          dataSet.layers.forEach(function (layer) {
            layerIds.push(layer._id);
          });
        });

        return _this5.db.Point.deleteOne({
          layer: { $in: layerIds }
        }).then(function () {
          return _this5.db.Layer.deleteOne({ _id: { $in: layerIds } });
        }).then(function () {
          return _this5.db.DataSet.deleteOne({ _id: { $in: dsIds } });
        });
      });
    }
  }]);

  return MongooseQueryInterface;
}(_QueryInterface3.default);

exports.default = MongooseQueryInterface;