import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  created_at: { type: Date, default: Date.now },
  album: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true }]
}, {
  collection: 'photos',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;
    delete retUpdated._id;
    return retUpdated;
  }
});

export default PhotoSchema;
