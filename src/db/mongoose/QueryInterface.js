import _pick from 'lodash.pick'
import QueryInterface from '../QueryInterface'
import debugFactory from 'debug'

const debug = debugFactory('gfs.query')

export default class MongooseQueryInterface extends QueryInterface {
  constructor (db) {
    super()
    this.db = db
  }

  findLatestGeneratedDate () {
    return this.db.DataSet
      .findOne()
      .sort({ generatedDate: -1 })
      .then((res) => {
        return res && res.generatedDate
      })
  }

  findOrUpsertDataSet (values) {
    return this.db.DataSet.findOneAndUpdate(
      { forecastedDate: values.forecastedDate },
      values,
      { upsert: true, new: true }
    )
  }

  findOrUpsertLayer (dataSet, descriptor, grid) {
    const values = {
      dataSet: dataSet._id,
      name: descriptor.name.toLowerCase(),
      surface: descriptor.surface
    }

    return new Promise((resolve, reject) => {
      this.db.Layer.findOneAndUpdate(
        values,
        values,
        { upsert: true, new: true, passRawResult: true },
        (err, layer, res) => {
          if (err) return reject(err)
          if (res && res.lastErrorObject && res.lastErrorObject.updatedExisting) {
            resolve(layer)
          } else {
            dataSet.layers.push(layer)
            dataSet.save((err, res) => {
              if (err) return reject(err)
              resolve(layer)
            })
          }
        }
      )
    })
      .then((layer) => {
        return this.db.Point.deleteOne({ layer: layer._id })
          .then(() => layer)
      })
      .then((layer) => {
        return this.db.Point.collection.insertMany(
          grid.map((value, x, y) => ({
            layer: layer._id,
            lnglat: { type: 'Point', coordinates: grid.lnglat(x, y) },
            value: value
          }))
        )
      })
  }

  __populatePoints (dataSets, criteria) {
    const map = {}

    if (dataSets === null) {
      return []
    }

    ;(Array.isArray(dataSets) ? dataSets : [dataSets])
      .forEach((dataSet) => dataSet.layers.forEach((layer) => {
        map[layer._id] = layer
        layer.points = []
      }))

    let withLayers
    if (Array.isArray(criteria)) {
      withLayers = {
        $or: criteria.map((c) => ({
          layer: { $in: Object.keys(map) },
          lnglat: c
        }))
      }
    } else {
      withLayers = {
        layer: { $in: Object.keys(map) },
        lnglat: criteria
      }
    }

    return this.db.Point.find(withLayers)
      .then((points) => {
        points.forEach((point) => {
          const layer = map[point.layer]
          if (!layer.points) layer.points = []
          layer.points.push(point)
        })
        return dataSets
      })
  }

  __findPoints (dsCriteria, layerCriteria, pointCriteria, fetchOne = false) {
    return (fetchOne
      ? this.db.DataSet.findOne(dsCriteria)
      : this.db.DataSet.find(dsCriteria)
    )
      .populate({
        path: 'layers',
        match: layerCriteria
      })
      .sort({ forecastedDate: 1 })
      .then((dataSets) => this.__populatePoints(dataSets, pointCriteria))
  }

  findGrid (dsCriteria, layerCriteria, bounds, sampleFactor) {
    let [nwLng, nwLat, seLng, seLat] = bounds

    if (seLng - nwLng >= 360) {
      // Edge case where the bounding box covers the whole globe
      nwLng = -180
      seLng = 180
    }

    return this.db.DataSet
      .findOne(dsCriteria)
      .populate({
        path: 'layers',
        match: layerCriteria
      })
      .sort({ forecastedDate: 1 })
      .then((dataSet) => {
        if (!dataSet || !dataSet.layers || !dataSet.layers[0]) throw new Error('no DataSet found')
        return dataSet.layers[0]
      })
      .then((layer) => {
        let query

        if (nwLng > 0 && seLng < 0) {
        // Bounding box goes over dateline, need to split into two boxes
          query = {
            $or: [{
              layer: layer._id,
              lnglat: this.__withinBounds(nwLng, nwLat, 180, seLat)
            }, {
              layer: layer._id,
              lnglat: this.__withinBounds(-180, nwLat, seLng, seLat)
            }]
          }
        } else {
          query = {
            layer: layer._id,
            lnglat: this.__withinBounds(nwLng, nwLat, seLng, seLat)
          }
        }

        return this.db.Point.find({
          ...query,
          $and: [
            { 'lnglat.coordinates.0': { $mod: [sampleFactor, 0] } },
            { 'lnglat.coordinates.1': { $mod: [sampleFactor, 0] } }
          ]
        })
      })
      .then((points) => ({
        dx: sampleFactor,
        dy: sampleFactor,
        bounds: [nwLng, nwLat, seLng, seLat],
        points
      }))
  }

  __withinBounds (nwLng, nwLat, seLng, seLat) {
    return {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [[
            [nwLng, nwLat],
            [nwLng, seLat],
            [seLng, seLat],
            [seLng, nwLat],
            [nwLng, nwLat]
          ]],
          crs: {
            type: 'name',
            properties: {
              name: 'urn:x-mongodb:crs:strictwinding:EPSG:4326'
            }
          }
        }
      }
    }
  }

  findPointsByCoords (dsCriteria, layerCriteria, points, fetchOne = false) {
    const pointCriteria = points.map((coords) => ({
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: coords
        }
      }
    }))

    return this.__findPoints(dsCriteria, layerCriteria, pointCriteria, fetchOne)
  }

  cleanupOldDataSets (ttl = 0) {
    return this.db.DataSet.find({
      forecastedDate: { $lte: new Date(Date.now() - ttl) }
    })
      .populate('layers')
      .then((dataSets) => {
        if (!dataSets) return

        const layerIds = []
        const dsIds = []
        dataSets.forEach((dataSet) => {
          dsIds.push(dataSet._id)
          dataSet.layers.forEach((layer) => {
            layerIds.push(layer._id)
          })
        })
        debug('cleanup:layerIds %j', layerIds)

        const results = []
        return this.db.Point.deleteMany({
          layer: { $in: layerIds }
        })
          .then(result => {
            results.push(result)
            debug('cleanup:Point.deleteMany %j', result)
          })
          .then(() => this.db.Layer.deleteMany({ _id: { $in: layerIds } }))
          .then(result => {
            results.push(result)
            debug('cleanup:Layer.deleteMany %j', result)
          })
          .then(() => this.db.DataSet.deleteMany({ _id: { $in: dsIds } }))
          .then(result => {
            results.push(result)
            debug('cleanup:DataSet.deleteMany %j', result)
          })
          .then(() => this.db.Point.collection.stats())
          .then(stats => {
            const _stats = _pick(stats, 'ns size count storageSize ok totalIndexSize indexSizes'.split(' '))
            debug('cleanup:Point.collection.stats %j', _stats)
            return results
          })
      })
  }
}
