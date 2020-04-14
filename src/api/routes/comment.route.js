const express = require('express');
const paginate = require('@middlewares/pagination');
const { CommentController } = require('@controllers');
const { checkAccessToken } = require('@middlewares/authorize');
const {
  commentValidate,
} = require('../validations/comment');

const router = express.Router();

router
  .route('/:commentId')
  .get(paginate({ limit: 5 }), CommentController.getComments);

router
  .route('/:postId')
  .post(
    checkAccessToken,
    commentValidate,
    CommentController.createComment,
  );

  router
  .route('/:commentId')
  .put(
    checkAccessToken,
    commentValidate,
    CommentController.editComment,
  );

  router
  .route('/:commentId')
  .delete(
    checkAccessToken,
    CommentController.deleteComment,
  );

module.exports = router;
