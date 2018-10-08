import mongoose, { Schema } from 'mongoose'

export default mongoose.model('DataSet', Schema({
  generatedDate: Date,
  forecastedDate: Date,
  layers: [{ type: Schema.Types.ObjectId, ref: 'Layer' }]
}))
