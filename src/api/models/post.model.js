const mongoose = require('mongoose');
const Schema = mongoose.Schema;

types = ['status, blog, book, food, movie, video, song'];

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
    comment: [
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
    relatedContent: [
      {
        value: {
          type: Schema.Types.ObjectId,
          refPath: 'relatedContent.type',
        },
        type: { type: String },
      },
    ],
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
    },
  },
  { timestamps: true },
);

postSchema.index({ tags: 1 }, { type: 1 }, { topic: 1 }, { authors: 1 });

const postModel = mongoose.model('Post', postSchema);

module.exports = {
  schema: postSchema,
  model: postModel,
};
