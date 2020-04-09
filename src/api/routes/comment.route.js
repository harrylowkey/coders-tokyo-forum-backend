const express = require('express');
const validate = require('express-validation');

const paginate = require('@middlewares/pagination');
const commentController = require('../controllers/comment.controller');
const authorization = require('@middlewares/authorize');

const router = express.Router();

router
  .route('/:commentId')
  .get(paginate({ limit: 5 }), commentController.getComments);

router
  .route('/:postId')
  .post(
    authorization.checkAccessToken,
    commentController.createComment,
  );

  router
  .route('/:commentId')
  .put(
    authorization.checkAccessToken,
    commentController.editComment,
  );

  router
  .route('/:commentId')
  .delete(
    authorization.checkAccessToken,
    commentController.deleteComment,
  );

module.exports = router;
