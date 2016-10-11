import db from '../db'

export default {
  fetchGeoJSON (layerName, forecastedDate, bounds) {
    return db.query.findPointsInBounds({forecastedDate}, {name: layerName}, bounds, true)
    .then((dataSet) => {
      if (!dataSet || !dataSet.layers || dataSet.layers.length !== 1) {
        throw new Error(`Can't find data for layer '${layerName}' at ${forecastedDate} within ${bounds}`)
      }

      return {
        type: 'FeatureCollection',
        features: dataSet.layers[0].points.map((point) => ({
          type: 'Feature',
          geometry: point.lnglat.toJSON(),
          properties: {
            value: point.value
          }
        }))
      }
    })
  }
}
