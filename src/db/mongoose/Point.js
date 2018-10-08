import mongoose, { Schema } from 'mongoose'

const pointSchema = Schema({
  layer: { type: Schema.Types.ObjectId, ref: 'Layer' },
  lnglat: {
    type: { type: String },
    coordinates: [Number]
  },
  value: [Number]
})
pointSchema.index({ layer: 1, lnglat: '2dsphere' })

export default mongoose.model('Point', pointSchema)
