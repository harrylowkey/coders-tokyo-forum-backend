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
    user: {
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
      maxlength: 1000,
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
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'File',
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
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'File'
    },
    foodPhotos: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'File',
        default: null
      }
    ],
    food: {
      type: Object,
      priceAverage: String,
      address: String,
      restaurant: String,
      quality: Number,
      service: Number,
      space: Number,
      openTime: String,
      foodName: {
        type: String,
        maxlength: 30
      },
      price: Number,
      stars: {
        type: Number,
        default: 0,
        max: 5,
        min: 0,
      }
    },
    book: {
      type: Object,
      status: String,
      country: String,
      year: Number,
      length: Number,
      genres: Array,
      suggestedBy: Array,
      stars: Number
    },
    movie: {
      type: Object,
      genres: Array,
      country: String,
      link: String,
      releaseDate: String,
      time: Number,
      stars: Number
    },
    savedBy: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true },
);

postSchema.index(
  { name: 1 },
  { tags: 1 },
  { type: 1 },
  { topic: 1 },
  { authors: 1 },
  { createdAt: -1 },
);

const postModel = mongoose.model('Post', postSchema);

module.exports = {
  schema: postSchema,
  model: postModel,
};
