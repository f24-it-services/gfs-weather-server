import {
  wrapLng,
  wrapLat
} from 'gfs-weather-utils'

import db from '../db'

export default {
  fetchGeoJSON (layerName, forecastedDate, bounds) {
    bounds[0] = wrapLng(bounds[0])
    bounds[1] = wrapLat(bounds[1])
    bounds[2] = wrapLng(bounds[2])
    bounds[3] = wrapLat(bounds[3])

    return db.query.findPointsInBounds({forecastedDate}, {name: layerName}, bounds, true)
    .then((dataSet) => {
      if (!dataSet || !dataSet.layers || dataSet.layers.length !== 1) {
        throw new Error(`Can't find data for layer '${layerName}' at ${forecastedDate} within ${bounds}`)
      }

      return {
        type: 'FeatureCollection',
        features: dataSet.layers[0].points.map((point) => ({
          type: 'Feature',
          geometry: point.lnglat.toJSON ? point.lnglat.toJSON() : point.lnglat,
          properties: {
            value: point.value
          }
        }))
      }
    })
  }
}
