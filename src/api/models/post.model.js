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
    likes: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
      },
    ],
    url: {
      type: String,
      trim: true,
      default: null,
    },
    media: {
      type: Object,
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
    food: {
      type: Object,
      foodName: {
        type: String,
        maxlength: 30,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      location: {
        type: String,
        maxlength: 100,
        required: true,
      },
      star: {
        type: Number,
        default: 0,
        max: 5,
        min: 0,
        required: true,
      },
      photos: [
        {
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
      ],
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
