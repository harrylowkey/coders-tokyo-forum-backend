const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const foodSchema = new Schema({
  _id: Schema.Types.ObjectId,
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
  },
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
  },
  url: {
    type: String,
  },
  star: {
    type: Number,
    default: 0,
    max: 5,
    min: 0,
  },
  photos: [
    {
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
  ],
});

const foodModel = mongoose.model('Food', foodSchema);

module.exports = {
  schema: foodSchema,
  model: foodModel,
};
