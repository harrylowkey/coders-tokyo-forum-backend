const express = require('express');
const validate = require('express-validation');

const paginate = require('@middlewares/pagination');
const commentController = require('../controllers/comment.controller');
const authorization = require('@middlewares/authorize');

const router = express.Router();

router
  .route('/:postId')
  .get(paginate({ limit: 5 }), commentController.getComments);

router
  .route('/')
  .post(
    authorization.checkAccessToken,
    commentController.createComment,
  );

module.exports = router;
