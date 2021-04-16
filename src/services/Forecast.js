import {
  Grid,
  sequence,
  wrapLngLat,
  wrapLng,
  wrapLat
} from 'gfs-weather-utils'

import db from '../db'

const INTERVAL = 3

export default {
  fetch (latlng, layers, startDate) {
    const [lng, lat] = wrapLngLat([latlng[1], latlng[0]])
    const la1 = wrapLat(Math.ceil(lat))
    const lo1 = wrapLng(Math.floor(lng))
    let la2 = wrapLat(Math.floor(lat))
    let lo2 = wrapLng(Math.ceil(lng))

    if (la1 === la2) la2 = wrapLat(la2 - 1)
    if (lo1 === lo2) lo2 = wrapLng(lo2 + 1)

    return db.query.findPointsByCoords(
      { forecastedDate: { $gte: startDate } },
      { $or: layers },
      [[lo1, la1], [lo2, la1], [lo1, la2], [lo2, la2]],
      false
    )
      .then((dataSets) => {
        const layerMap = {}
        const layerKey = (layer) => `${layer.name}:${layer.surface}`
        layers.forEach((layer) => {
          layerMap[layerKey(layer)] = {
            ...layer,
            values: []
          }
        })

        dataSets.forEach((dataSet) => {
          const offset = Math.floor((dataSet.forecastedDate.getTime() - startDate.getTime()) / (INTERVAL * 3600000))
          // Initialize all values at the current forecast offset with nulls
          layers.forEach((layer) => {
            layerMap[layerKey(layer)].values[offset] = null
          })
          // Set every value we received for the current offset to our layer map
          dataSet.layers.forEach((layer) => {
            const data = []
            layer.points.forEach((p) => {
              const [lo, la] = p.lnglat.coordinates
              const i = (la1 - la) * 2 + (lo - lo1)
              data[i] = p.value
            // console.log(i, lo, la, p.value, lo1, la1)
            })
            const grid = new Grid(0, la1, lo1, 1, 1, 2, 2, data)
            // console.log(lng, lat)
            // console.log(grid.interpolateAt(lat, lng))
            layerMap[layerKey(layer)].values[offset] = grid.interpolateAt(lat, lng)
          })
        })

        return {
          start: startDate,
          interval: INTERVAL,
          position: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          layers: Object.keys(layerMap).map((key) => layerMap[key])
        }
      })
  },

  bulkFetch (coordinates, layers, startDate) {
    const result = {
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
