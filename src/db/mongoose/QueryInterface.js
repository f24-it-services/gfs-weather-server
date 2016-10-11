import QueryInterface from '../QueryInterface'

export default class MongooseQueryInterface extends QueryInterface {
  constructor (db) {
    super()
    this.db = db
  }

  findLatestGeneratedDate () {
    return this.db.DataSet
    .findOne()
    .sort({generatedDate: -1})
    .then((res) => {
      return res && res.generatedDate
    })
  }

  findOrUpsertDataSet (values) {
    return this.db.DataSet.findOneAndUpdate(
      {forecastedDate: values.forecastedDate},
      values,
      {upsert: true, new: true}
    )
  }

  findOrUpsertLayer (dataSet, descriptor, grid) {
    let values = {
      dataSet: dataSet._id,
      name: descriptor.name.toLowerCase(),
      surface: descriptor.surface
    }

    return new Promise((resolve, reject) => {
      this.db.Layer.findOneAndUpdate(
        values,
        values,
        {upsert: true, new: true, passRawResult: true},
        (err, layer, res) => {
          if (err) return reject(err)
          if (res.lastErrorObject.updatedExisting) {
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
      return this.db.Point.remove({layer: layer._id})
      .then(() => layer)
    })
    .then((layer) =>
      this.db.Point.collection.insert(
        grid.map((value, x, y) => ({
          layer: layer._id,
          lnglat: {type: 'Point', coordinates: grid.lnglat(x, y)},
          value: value
        }))
      )
    )
  }

  __populatePoints (dataSets, criteria) {
    let map = {}

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
          layer: {$in: Object.keys(map)},
          lnglat: c
        }))
      }
    } else {
      withLayers = {
        layer: {$in: Object.keys(map)},
        lnglat: criteria
      }
    }

    return this.db.Point.find(withLayers)
    .then((points) => {
      points.forEach((point) => {
        let layer = map[point.layer]
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
    .sort({forecastedDate: 1})
    .then((dataSets) => this.__populatePoints(dataSets, pointCriteria))
  }

  __wrapLngLat ([lng, lat]) {
    return [
      lng < -180 ? (lng + 360) % 360 : (lng > 180 ? (lng + 360) % 360 - 360 : lng),
      lat
    ]
  }

  findPointsInBounds (dsCriteria, layerCriteria, bounds, fetchOne = false) {
    const pointCriteria = {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [[
            this.__wrapLngLat([bounds[0], bounds[1]]),
            this.__wrapLngLat([bounds[0], bounds[3]]),
            this.__wrapLngLat([bounds[2], bounds[3]]),
            this.__wrapLngLat([bounds[2], bounds[1]]),
            this.__wrapLngLat([bounds[0], bounds[1]])
          ]]
        }
      }
    }

    return this.__findPoints(dsCriteria, layerCriteria, pointCriteria, fetchOne)
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
}
