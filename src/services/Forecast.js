import {Grid, sequence} from 'gfs-weather-utils'
import db from '../db'

export default {
  fetch (latlng, layers, startDate) {
    let [lat, lng] = latlng
    let la1 = Math.ceil(lat)
    let lo1 = Math.floor(lng)
    let la2 = Math.floor(lat)
    let lo2 = Math.ceil(lng)

    if (la1 === la2) la2--
    if (lo1 === lo2) lo2++
    if (lo1 > 180 || lo1 < -180) lo1 = (lo1 - 360) % 360
    if (lo2 > 180 || lo2 < -180) lo2 = (lo2 + 360) % 360

    return db.query.findPointsByCoords(
      {forecastedDate: {$gte: startDate}},
      {$or: layers},
      [[lo1, la1], [lo2, la1], [lo1, la2], [lo2, la2]],
      false
    )
    .then((dataSets) => {
      let layerMap = {}
      let layerKey = (layer) => `${layer.name}:${layer.surface}`
      layers.forEach((layer) => {
        layerMap[layerKey(layer)] = {
          ...layer,
          values: []
        }
      })

      dataSets.forEach((dataSet, offset) => {
        // Initialize all values at the current forecast offset with nulls
        layers.forEach((layer) => {
          layerMap[layerKey(layer)].values[offset] = null
        })
        // Set every value we received for the current offset to our layer map
        dataSet.layers.forEach((layer) => {
          let data = []
          layer.points.forEach((p) => {
            let [lo, la] = p.lnglat.coordinates
            let i = (la1 - la) * 2 + (lo - lo1)
            data[i] = p.value
            // console.log(i, lo, la, p.value)
          })
          let grid = new Grid(0, la1, lo1, 1, 1, 2, 2, data)
          // console.log(lng, lat, grid.interpolateAt(lat, lng))
          layerMap[layerKey(layer)].values[offset] = grid.interpolateAt(lat, lng)
        })
      })

      return {
        start: startDate,
        interval: 3,
        position: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        layers: Object.keys(layerMap).map((key) => layerMap[key])
      }
    })
  },

  bulkFetch (coordinates, layers, startDate) {
    let result = {
      start: startDate,
      interval: 3,
      forecasts: []
    }

    return sequence(coordinates.map((coord) => () => {
      return this.fetch(coord.latlng, layers, startDate).then((forecast) => {
        result.forecasts.push({
          id: coord.id,
          position: forecast.position,
          layers: forecast.layers
        })
      })
    }))
    .then(() => result)
  }
}
