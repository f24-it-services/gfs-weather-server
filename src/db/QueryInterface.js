export default class QueryInterface {
  findLatestGeneratedDate () {
    throw new Error('Must implement findLatestGeneratedDate()')
  }

  findOrUpsertDataSet (values) {
    throw new Error('Must implement findOrUpsertDataSet()')
  }

  findOrUpsertLayer (dataSet, descriptor, grid) {
    throw new Error('Must implement findOrUpsertLayer()')
  }

  findGrid (dsCriteria, layerCriteria, bounds, sampleFactor) {
    throw new Error('Must implement findGrid()')
  }

  findPointsByCoords (dsCriteria, layerCriteria, points, fetchOne = false) {
    throw new Error('Must implement findPointsByCoords()')
  }

  cleanupOldDataSets (ttl) {
    throw new Error('Must implement cleanupOldDataSets()')
  }
}
