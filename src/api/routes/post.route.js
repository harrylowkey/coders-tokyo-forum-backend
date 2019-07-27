const express = require('express');
const validate = require('express-validation');

const postController = require('../controllers/post.controller');
const authorization = require('../../middlewares/authorize');

const router = express.Router();

router
  .route('/')
  .post(authorization.checkAccessToken, postController.createPost);

module.exports = router;
