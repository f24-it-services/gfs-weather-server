import mongoose from 'mongoose'

import Config from '../../Config'
import DataSet from './DataSet'
import Layer from './Layer'
import Point from './Point'
import QueryInterface from './QueryInterface'

const db = {DataSet, Layer, Point}

export default db

export function bootstrap (connected) {
  const config = Config.get().mongoose

  // Bootstrap mongoose
  // http://mongoosejs.com/docs/promises.html
  mongoose.Promise = global.Promise
  !connected && mongoose.connect(config.connString, config.options)

  db.query = new QueryInterface(db)

  return db
}

export function disconnect () {
  return mongoose.disconnect()
}
