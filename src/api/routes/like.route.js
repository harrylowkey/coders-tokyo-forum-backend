const express = require('express');
const validate = require('express-validation');

const authorization = require('../../middlewares/authorize');
const postController = require('../controllers/post.controller');
const router = express.Router();

router
  .route('/posts/:postId')
  .post(authorization.checkAccessToken, postController.likePost);

module.exports = router;
