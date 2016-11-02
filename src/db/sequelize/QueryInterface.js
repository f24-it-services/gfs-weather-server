import dbStreamer from 'db-streamer'
import Config from '../../Config'
import QueryInterface from '../QueryInterface'

export default class SequelizeQueryInterface extends QueryInterface {
  constructor (db) {
    super()
    this.db = db
  }

  findLatestGeneratedDate () {
    return this.db.DataSet.findOne({
      order: [['generated_date', 'DESC']]
    })
    .then((dataSet) => dataSet && dataSet.generatedDate)
  }

  findOrUpsertDataSet (values) {
    return this.db.DataSet.findOrCreate({
      where: {forecastedDate: values.forecastedDate},
      defaults: values
    })
    .spread(function (dataSet, created) {
      if (created) {
        return dataSet
      } else {
        return dataSet.updateAttributes(values)
      }
    })
  }

  findOrUpsertLayer (dataSet, descriptor, grid) {
    const values = {
      data_set_id: dataSet.id,
      name: descriptor.name.toLowerCase(),
      surface: descriptor.surface
    }

    return this.db.Layer.findOrCreate({
      where: values,
      defaults: values
    })
    .spread((layer, created) => {
      if (created) {
        return layer
      } else {
        return layer.updateAttributes(values).then((layer) => {
          return this.db.Point.destroy({
            where: {layer_id: layer.id}
          })
          .then(() => layer)
        })
      }
    })
    .then((layer) => {
      return this.createInserter('weather.points', ['layer_id', 'lnglat', 'value'])
      .then((inserter) => {
        return new Promise((resolve, reject) => {
          grid.forEach((value, x, y) => {
            if (!value) return
            let [lng, lat] = grid.lnglat(x, y)
            inserter.push({
              layer_id: layer.id,
              lnglat: `SRID=4326;POINT(${lng} ${lat})`,
              value: `{${value.join ? value.join(',') : value}}`
            })
          })

          inserter.setEndHandler((err) => {
            if (err) return reject(err)
            resolve()
          })

          inserter.end()
        })
      })
    })
  }

  createInserter (table, columns) {
    const config = Config.get().sequelize
    const connString = `${config.options.dialect}://${config.user}:${config.password}@${config.options.host}:${config.options.port}/${config.database}`

    return new Promise((resolve, reject) => {
      let inserter = dbStreamer.getInserter({
        dbConnString: connString,
        tableName: table,
        columns: columns
      })

      inserter.connect((err) => {
        if (err) return reject(err)
        resolve(inserter)
      })
    })
  }

  findPointsInBounds (dsCriteria, layerCriteria, bounds, fetchOne = false) {
    let [swLng, swLat, neLng, neLat] = bounds

    let query = {
      where: dsCriteria,
      include: [{
        model: this.db.Layer,
        as: 'layers',
        where: layerCriteria,
        include: [{
          model: this.db.Point,
          as: 'points',
          where: [`lnglat && ?::geography`, [`POLYGON((${swLng} ${swLat},${swLng} ${neLat},${neLng} ${neLat},${neLng} ${swLat},${swLng} ${swLat}))`]]
        }]
      }],
      order: [['forecastedDate', 'ASC']]
    }

    return fetchOne ? this.db.DataSet.find(query) : this.db.DataSet.findAll(query)
  }

  findPointsByCoords (dsCriteria, layerCriteria, points, fetchOne = false) {
    let args = []
    let where = points.map(([lng, lat]) => {
      args.push(lng, lat)
      return `(ST_X(lnglat) = ? AND ST_Y(lnglat) = ?)`
    })
    .join(' OR ')

    let query = {
      where: dsCriteria,
      include: [{
        model: this.db.Layer,
        as: 'layers',
        where: layerCriteria,
        include: [{
          model: this.db.Point,
          as: 'points',
          where: [`(${where})`].concat(args)
        }]
      }],
      order: [['forecastedDate', 'ASC']]
    }

    return fetchOne ? this.db.DataSet.find(query) : this.db.DataSet.findAll(query)
  }
}
