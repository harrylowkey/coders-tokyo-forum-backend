const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
  publicId: {
    type: String,
    trim: true
  },
  secureURL: {
    type: String,
    trim: true
  },
  media: {
    type: Object,
    signature: String,
    width: Number,
    height: Number,
    format: String,
    resource_type: String,
    frame_rate: Number,
    bit_rate: Number,
    duration: Number,
  },
  fileName: String,
  sizeBytes: Number,
  resourceType: String
}, { timestamps: true });

fileSchema.index(
  { userId: 1 },
  { postId: 1 },
  { publicId: 1 }
);

const fileModel = mongoose.model('File', fileSchema);

module.exports = {
  schema: fileSchema,
  model: fileModel,
};
