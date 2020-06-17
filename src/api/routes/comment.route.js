const express = require('express');
const paginate = require('@middlewares/pagination');
const { CommentController } = require('@controllers');
const { checkAccessToken } = require('@middlewares/authorize');
const {
  commentValidate,
} = require('../validations/comment');
const { sanitizeContent } = require('../../middlewares/sanitizeInput');

const router = express.Router();

router
  .route('/loadmore/:postId')
  .get(paginate({ limit: 5 }), CommentController.loadmoreComments);

router
  .route('/:postId')
  .post(
    checkAccessToken,
    commentValidate,
    CommentController.createComment,
  );

router
  .route('/reply/:commentId')
  .post(
    checkAccessToken,
    (req, res, next) => sanitizeContent(req, res, next),
    commentValidate,
    CommentController.replyComment,
  );

router
  .route('/thread/reply/:parentId/:commentId')
  .post(
    checkAccessToken,
    commentValidate,
    CommentController.threadReplyComment,
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
