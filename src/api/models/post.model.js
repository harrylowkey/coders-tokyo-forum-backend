const mongoose = require('mongoose');
const Schema = mongoose.Schema;

types = ['discussion', 'blog', 'book', 'food', 'movie', 'video', 'song'];

const postSchema = new Schema(
  {
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
      required: true,
    },
    content: {
      type: String,
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
      required: true,
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
    likes: [
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
