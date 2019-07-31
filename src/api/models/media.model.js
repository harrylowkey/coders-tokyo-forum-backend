const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['video', 'song', 'movie', 'podcast'];

const mediaSchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  mediaName: {
    type: String,
    required: true,
    maxlength: 250,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: types,
    default: 'video',
  },
});

mediaSchema.index({ authors: 1 });

const mediaModel = mongoose.model('Media', mediaSchema);

module.exports = {
  schema: mediaSchema,
  model: mediaModel,
};
