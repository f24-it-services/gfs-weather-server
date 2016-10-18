import Pbf from 'pbf'
import geobuf from 'geobuf'
import debugFactory from 'debug'

import Forecast from '../../services/Forecast'
import GridLoader from '../../services/GridLoader'

const debug = debugFactory('gfs.server')

// FIXME move to shared library
function clamp (v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export default function attach (server) {
  // FIXME move to separate route file
  server.get('/forecast', (req, res, next) => {
    let layers = req.query.layers

    if (!Array.isArray(layers)) {
      layers = [layers]
    }

    layers = layers.map((layer) => {
      let [name, surface] = layer.split('@')
      return {name, surface}
    })

    let fromDate = new Date(parseInt(req.query.from))
    let lat = clamp(req.query.lat, -90, 90)
    let lng = clamp(req.query.lng, -180, 180)

    Forecast
    .fetch([lat, lng], layers, fromDate)
    .then((result) => {
      res.send(result)
      next()
    }, next)
  })

  server.get('/layer/:name/:date', (req, res, next) => {
    debug(`Get layer name=${req.params.name} date=${req.params.date} bounds=${req.query.bb}`)
    let forecastedDate = new Date(parseInt(req.params.date))
    let bounds = req.query.bb.split(',').map((c) => parseFloat(c))
    bounds = [bounds[1], bounds[2], bounds[3], bounds[0]]

    GridLoader
    .fetchGeoJSON(req.params.name, forecastedDate, bounds)
    .then((geoJSON) => {
      res.setHeader('content-type', 'application/x-protobuf')
      res.send(geobuf.encode(geoJSON, new Pbf()))
      next()
    }, (err) => {
      debug('error', err)
      next(err)
    })
  })
}
