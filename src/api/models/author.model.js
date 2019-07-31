const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['author', 'singer', 'composer', 'actor', 'director'];

const authorSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 20,
  },
  type: {
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
