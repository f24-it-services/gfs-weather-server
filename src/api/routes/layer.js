import {cacheControl, forecast, layer, sendJson, sendError, sendBuffer, sendErrorBuffer} from '../middleware'

const CACHE_CONTROL_MAX_AGE = 3 * 3600 // 3hours

export default function attach (server) {
  server.get('/forecast', forecast, cacheControl(CACHE_CONTROL_MAX_AGE), sendJson, sendError)

  server.get('/layer/:name/:date', layer, cacheControl(CACHE_CONTROL_MAX_AGE), sendBuffer, sendErrorBuffer)
}
