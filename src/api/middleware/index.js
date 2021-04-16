import Pbf from 'pbf'
import geobuf from 'geobuf'
import debugFactory from 'debug'

import Forecast from '../../services/Forecast'
import GridLoader from '../../services/GridLoader'

const debug = debugFactory('gfs.server')

const EMPTY_GEOJSON_BUFFER = Buffer.from(geobuf.encode({
  type: 'FeatureCollection',
  features: []
}, new Pbf()), 'binary')

/**
 * express middleware for obtaining forecast data
 * requires `?layers=` as query parameter
 */
export function forecast (req, res, next) {
  let layers = req.query.layers
  if (!Array.isArray(layers)) {
    layers = [layers]
  }

  layers = layers.map((layer) => {
    const [name, surface] = layer.split('@')
    return { name, surface }
  })

  const fromDate = new Date(parseInt(req.query.from))
  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)

  Forecast
    .fetch([lat, lng], layers, fromDate)
    .then((result) => {
      res.body = result
      next()
    }, next)
}

/**
 * express middleware for obtaining a layer
 * requires `/:name/:date` in route URI
 */
export function layer (req, res, next) {
  debug(`Get layer name=${req.params.name} date=${req.params.date} bounds=${req.query.bb}`)
  const forecastedDate = new Date(parseInt(req.params.date))
  const bounds = req.query.bb.split(',').map((c) => parseFloat(c))

  GridLoader
    .fetchGeoJSON(req.params.name, forecastedDate, bounds, parseInt(req.query.sf))
    .then((geoJSON) => {
      res.body = geoJSON || {}
      next()
    }, (err) => {
      debug('error %s', err)
      next(err)
    })
}

export function cacheControl (maxAge) {
  return function (req, res, next) {
    res.setHeader('Cache-Control', `max-age=${maxAge}`)
    next && next()
  }
}

export function sendBuffer (req, res, next) {
  const buff = geobuf.encode(res.body, new Pbf())
  res.setHeader('Content-Type', 'application/x-protobuf')
  res.send(Buffer.from(buff, 'binary'))
  next && next()
}

export function sendErrorBuffer (err, req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, max-age=0')
  res.setHeader('Content-Type', 'application/x-protobuf')
  res.status(404).send(EMPTY_GEOJSON_BUFFER)
  next && next(err)
}

export function sendJson (req, res, next) {
  res.send(res.body)
  next && next()
}

export function sendError (err, req, res, next) {
  res.setHeader('Cache-Control', 'no-cache, max-age=0')
  res.status(404).send({})
  next && next(err)
}
