'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QueryInterface = function () {
  function QueryInterface() {
    _classCallCheck(this, QueryInterface);
  }

  _createClass(QueryInterface, [{
    key: 'findLatestGeneratedDate',
    value: function findLatestGeneratedDate() {
      throw new Error('Must implement findLatestGeneratedDate()');
    }
  }, {
    key: 'findOrUpsertDataSet',
    value: function findOrUpsertDataSet(values) {
      throw new Error('Must implement findOrUpsertDataSet()');
    }
  }, {
    key: 'findOrUpsertLayer',
    value: function findOrUpsertLayer(dataSet, descriptor, grid) {
      throw new Error('Must implement findOrUpsertLayer()');
    }
  }, {
    key: 'findPointsInBounds',
    value: function findPointsInBounds(dsCriteria, layerCriteria, bounds) {
      var fetchOne = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      throw new Error('Must implement findPointsInBounds()');
    }
  }, {
    key: 'findPointsByCoords',
    value: function findPointsByCoords(dsCriteria, layerCriteria, points) {
      var fetchOne = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      throw new Error('Must implement findPointsByCoords()');
    }
  }, {
    key: 'cleanupOldDataSets',
    value: function cleanupOldDataSets(ttl) {
      throw new Error('Must implement cleanupOldDataSets()');
    }
  }]);

  return QueryInterface;
}();

exports.default = QueryInterface;