const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  tagName: {
    type: String,
    maxlength: 30,
    required: true,
    trim: true,
  }
});

tagSchema.index({ tagName: 1 });

const tagModel = mongoose.model('Tag', tagSchema);

module.exports = {
  schema: tagSchema,
  model: tagModel,
};
