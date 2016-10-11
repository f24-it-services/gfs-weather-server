import {CORS} from 'restify'

export default function headers (server) {
  server.use(CORS())
}
