import mongoose, {Schema} from 'mongoose'

export default mongoose.model('Layer', Schema({
  dataSet: {type: Schema.Types.ObjectId, ref: 'DataSet'},
  name: 'string',
  surface: 'string'
}))
