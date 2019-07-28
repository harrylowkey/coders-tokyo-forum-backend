const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  _id: Schema.Types.ObjectId,
  tagName: {
    type: String,
    maxlength: 30,
    required: true,
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
});

const tagModel = mongoose.model('Tag', tagSchema);

module.exports = {
  schema: tagSchema,
  model: tagModel,
};
