const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['Author', 'Singer', 'Composer', 'Actor', 'Director'];

const authorSchema = new Schema({
  _id: Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
    maxlength: 20,
  },
  types: {
    type: String,
    enum: types,
    default: 'author',
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
});

authorSchema.index({ name: 1 });

const authorModel = mongoose.model('Author', authorSchema);

module.exports = {
  schema: authorSchema,
  model: authorModel,
};
