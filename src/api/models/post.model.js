const mongoose = require('mongoose');
const Schema = mongoose.Schema;

types = [
  'discussion',
  'blog',
  'book',
  'food',
  'movie',
  'video',
  'song',
  'podcast',
];

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
    url: {
      type: String,
      trim: true,
      required: false,
      default: null,
    },
    media: {
      public_id: String,
      url: String,
      secure_url: String,
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
  },
  { timestamps: true },
);

postSchema.index(
  { name: 1 },
  { tags: 1 },
  { type: 1 },
  { topic: 1 },
  { authors: 1 },
);

const postModel = mongoose.model('Post', postSchema);

module.exports = {
  schema: postSchema,
  model: postModel,
};
