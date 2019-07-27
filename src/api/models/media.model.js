const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = [video, song, movie];

const mediaSchema = new Schema({
  _id: Schema.Types.ObjectId,
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'video',
  },
  authors: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Author',
    },
  ],
});

mediaSchema.index({ authors: 1 });

const mediaModel = mongoose.model('Media', mediaSchema);

module.exports = {
  schema: mediaSchema,
  model: mediaModel,
};
