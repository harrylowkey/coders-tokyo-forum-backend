const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const types = ['author', 'singer', 'composer', 'actor', 'actress', 'director'];

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
  }
});

authorSchema.index({ name: 1, type: 1 });

const authorModel = mongoose.model('Author', authorSchema);

module.exports = {
  schema: authorSchema,
  model: authorModel,
};
