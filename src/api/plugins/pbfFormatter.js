export default function pbfFormatter (server) {
  server.formatters['application/x-protobuf'] = function (req, res, body, cb) {
    res.setHeader('Content-Length', body.length)
    res.write(Buffer.from(body))
    res.end()
  }
}
