const mongoose = require('mongoose');
const Schema = mongoose.Schema;

types = ['status', 'blog', 'book', 'food', 'movie', 'video', 'song'];

const postSchema = new Schema(
  {
    _id: Schema.Types.ObjectId,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    type: {
      type: String,
      enum: types,
      default: 'status',
      required: true,
    },
    foodInstance: {
      type: Schema.Types.ObjectId,
      ref: 'Food',
      default: null,
    },
    mediaInstance: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    topic: {
      type: String,
      maxlength: 200,
      required: true,
    },
    description: {
      type: String,
      maxlength: 400,
    },
    content: {
      type: String,
      required: true,
    },
    authors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Author',
        default: null,
      },
    ],
    cover: {
      type: Object,
      pubic_id: {
        type: String,
        trim: true,
        lowercase: true,
      },
      url: {
        type: String,
        trim: true,
        lowercase: true,
      },
      secure_url: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    flowers: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true },
);

postSchema.index({ tags: 1 }, { type: 1 }, { topic: 1 }, { authors: 1 });

const postModel = mongoose.model('Post', postSchema);

module.exports = {
  schema: postSchema,
  model: postModel,
};
