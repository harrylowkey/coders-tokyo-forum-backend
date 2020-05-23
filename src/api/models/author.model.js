const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['author', 'artist', 'composer', 'actor', 'director'];

const authorSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
  },
  type: {
    type: String,
    enum: types,
    default: 'author',
  },
  avatar: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'File'
  },
  description: {
    type: String
  }
});

authorSchema.index({ name: 1, type: 1 });

const authorModel = mongoose.model('Author', authorSchema);

module.exports = {
  schema: authorSchema,
  model: authorModel,
};
