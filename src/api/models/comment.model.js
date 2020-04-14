const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    childComments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
      }
    ],
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true },
);

commentSchema.index(
  { postId: 1 },
  { parentId: 1 },
  { createdAt: -1 },
);

const commentModel = mongoose.model('Comment', commentSchema);

module.exports = {
  schema: commentSchema,
  model: commentModel,
};
