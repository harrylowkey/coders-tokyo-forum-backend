const express = require('express');
const validate = require('express-validation');
const multer = require('multer');

const postController = require('../controllers/post.controller');
const authorization = require('@middlewares/authorize');
const paginate = require('@middlewares/pagination');

const router = express.Router();
var storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

router.route('/').get(paginate(), postController.getPosts);

router
  .route('/tags')
  .get(paginate(), postController.getPostsByTagsName);

router.route('/:postId').get(postController.getOnePost);

router
  .route('/')
  .post(
    authorization.checkAccessToken,
    upload.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
      { name: 'foodPhotos', maxCount: 10 },
    ]),
    postController.createPost,
  );

router
  .route('/:postId')
  .put(
    authorization.checkAccessToken,
    upload.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'audio', maxCount: 1 },
      { name: 'foodPhotos', maxCount: 10 },
    ]),
    postController.editPost,
  );

router
  .route('/users/:userId')
  .get(paginate({ limit: 15 }), postController.getPosts);

router
  .route('/saved-posts/users/:userId')
  .get(paginate({ limit: 15 }), postController.getSavedPosts);

router
  .route('/:postId')
  .delete(authorization.checkAccessToken, postController.deletePost);

router
  .route('/:postId/like')
  .post(authorization.checkAccessToken, postController.likePost);

router
  .route('/:postId/unlike')
  .post(authorization.checkAccessToken, postController.unlikePost);

router
  .route('/:postId/save')
  .post(authorization.checkAccessToken, postController.savePost);

router
  .route('/:postId/unsave')
  .post(authorization.checkAccessToken, postController.unsavePost);

module.exports = router;
