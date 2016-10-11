'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pbfFormatter;
function pbfFormatter(server) {
  server.formatters['application/x-protobuf'] = function (req, res, body, cb) {
    res.setHeader('Content-Length', body.length);
    res.write(Buffer.from(body));
    res.end();
  };
}