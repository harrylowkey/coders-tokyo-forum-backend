const mongoose = require('mongoose');

const { Schema } = mongoose;

const tagSchema = new Schema({
  tagName: {
    type: String,
    maxlength: 15,
    required: true,
    trim: true,
  },
});

tagSchema.index({ tagName: 1 });

const tagModel = mongoose.model('Tag', tagSchema);

module.exports = {
  schema: tagSchema,
  model: tagModel,
};
