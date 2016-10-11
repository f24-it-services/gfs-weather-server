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
}
