const express = require('express');

const router = express.Router();
const {
  BlogController, BookController, FoodController,
  MovieController, PostController, DiscussionController,
  MediaController,
} = require('@controllers');

const { checkAccessToken } = require('@middlewares/authorize');
const paginate = require('@middlewares/pagination');
const {
  Blog, Book, Food,
  Movie, Video, Audio, Discussion,
  Post,
} = require('@validations');

/** ----------- CONFIG --------------- */
const { foodPhotosConfig } = require('@configVar');
const { sanitizeInput } = require('../../middlewares/sanitizeInput');
const { configStorage } = require('../../config/cloudinary');

const uploadFoodPhotos = configStorage(foodPhotosConfig);

const {
  uploadVideo,
} = require('../../config/cloudinary').configMulter;

/** ------------ -------------------- */

router
  .route('/discussions')
  .post(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Discussion.validatePOST,
    DiscussionController.createDiscussion,
  );

router
  .route('/discussions/:postId')
  .put(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Discussion.validatePUT,
    DiscussionController.editDiscussion,
  );

router
  .route('/blogs')
  .post(
    checkAccessToken,
    Blog.validatePOST,
    BlogController.createBlog,
  );

router
  .route('/blogs/:postId')
  .put(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Blog.validatePUT,
    BlogController.editBlog,
  );

router
  .route('/books')
  .post(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Book.validatePOST,
    BookController.createBookReview,
  );
router
  .route('/books/:postId')
  .put(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Book.validatePUT,
    BookController.editBookReview,
  );

router
  .route('/food')
  .post(
    checkAccessToken,
    uploadFoodPhotos.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'foodPhotos', maxCount: 10 },
    ]),
    (req, res, next) => sanitizeInput(req, res, next),
    Food.validatePOST,
    FoodController.createFoodReview,
  );
router
  .route('/food/:postId')
  .put(
    checkAccessToken,
    uploadFoodPhotos.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'foodPhotos', maxCount: 10 },
    ]),
    (req, res, next) => sanitizeInput(req, res, next),
    Food.validatePUT,
    FoodController.editFoodReview,
  );

router
  .route('/movies')
  .post(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Movie.validatePOST,
    MovieController.createMovieReview,
  );
router
  .route('/movies/:postId')
  .put(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Movie.validatePUT,
    MovieController.editMovieReview,
  );

router
  .route('/videos')
  .post(
    checkAccessToken,
    uploadVideo.single('video'),
    Video.validatePOST,
    PostController.createVideo,
  );

router
  .route('/videos/:postId')
  .put(
    checkAccessToken,
    uploadVideo.single('video'),
    Video.validatePUT,
    PostController.editVideo,
  );

router
  .route('/songs')
  .post(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Audio.validatePOST,
    MediaController.createAudio,
  );

router
  .route('/songs/:postId')
  .put(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Audio.validatePUT,
    MediaController.editAudio,
  );
router
  .route('/podcasts')
  .post(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Audio.validatePOST,
    MediaController.createAudio,
  );

router
  .route('/podcasts/:postId')
  .put(
    checkAccessToken,
    (req, res, next) => sanitizeInput(req, res, next),
    Audio.validatePUT,
    MediaController.editAudio,
  );

router
  .route('/')
  .get(PostController.getPosts);

router
  .route('/tags')
  .get(paginate(), PostController.getPostsByTagsName);

router
  .route('/:postId')
  .get(Post.validateGetPost, PostController.getOnePost);

router
  .route('/users/:userId')
  .get(paginate({ limit: 15 }), PostController.getPosts);

router
  .route('/savedPosts/user')
  .get(paginate({ limit: 15 }), checkAccessToken, PostController.getSavedPosts);

router
  .route('/:postId')
  .delete(checkAccessToken, PostController.deletePost);

router
  .route('/:postId/like')
  .post(checkAccessToken, PostController.likePost);

router
  .route('/:postId/unlike')
  .post(checkAccessToken, PostController.unlikePost);

router
  .route('/:postId/save')
  .post(checkAccessToken, PostController.savePost);

router
  .route('/:postId/unsave')
  .post(checkAccessToken, PostController.unsavePost);

router
  .route('/tags/statics')
  .get(PostController.countTags);

router
  .route('/topPosts/statics')
  .get(PostController.topPosts);

router
  .route('/audios/trending')
  .get(MediaController.trendingAudio);

router
  .route('/recommend/users/:userId')
  .get(paginate({ limit: 3 }), PostController.getRecommendPosts);

module.exports = router;
