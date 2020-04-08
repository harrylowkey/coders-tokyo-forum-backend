const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    }
  },
  { timestamps: true },
);

postSchema.index(
  { postId: 1 },
  { parentId: 1 },
  { createdAt: -1 },
);

const commentModel = mongoose.model('Comment', commentSchema);

module.exports = {
  schema: commentSchema,
  model: commentModel,
};
