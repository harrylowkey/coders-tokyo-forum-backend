const express = require('express');
const router = express.Router();
const multer = require('multer')
const {
  BlogController, BookController, FoodController,
  MovieController, PostController, DiscussionController
} = require('@controllers')

const { checkAccessToken } = require('@middlewares/authorize');
const paginate = require('@middlewares/pagination');
const { Blog, Book, Food,
  Movie, Video, Audio, Discussion
} = require('@validations');

/** ----------- CONFIG --------------- */
const { blogCoverConfig, audioConfig, foodPhotosConfig, videoConfig } = require('@configVar')
const { configStorage } = require('../../config/cloudinary')
const uploadBlog = configStorage(blogCoverConfig)
const uploadFoodPhotos = configStorage(foodPhotosConfig)

const videoStorage = multer.diskStorage(videoConfig)
const uploadVideo = multer({ storage: videoStorage })

const audioStorage = multer.diskStorage(audioConfig)
const uploadAudio = multer({ storage: audioStorage })

/** ------------ -------------------- */


router
  .route('/blogs')
  .post(
    checkAccessToken,
    uploadBlog.single('coverImage'),
    Blog.validatePOST,
    BlogController.createBlog,
  )

router
  .route('/blogs/:postId')
  .put(
    checkAccessToken,
    uploadBlog.single('coverImage'),
    Blog.validatePUT,
    BlogController.editBlog,
  )

router
  .route('/books')
  .post(
    checkAccessToken,
    uploadBlog.single('coverImage'),
    Book.validatePOST,
    BookController.createBookReview,
  )
  .put(
    checkAccessToken,
    uploadBlog.single('coverImage'),
    Book.validatePUT,
    BookController.editBookReview,
  )

router
  .route('/food')
  .post(
    checkAccessToken,
    uploadFoodPhotos.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'foodPhotos', maxCount: 10 }
    ]),
    Food.validatePOST,
    FoodController.createFoodReview
  )
  .put(
    checkAccessToken,
    uploadFoodPhotos.fields([
      { name: 'coverImage', maxCount: 1 },
      { name: 'foodPhotos', maxCount: 10 }
    ]),
    Food.validatePUT,
    FoodController.editFoodReview
  )

router
  .route('/movies')
  .post(
    checkAccessToken,
    uploadBlog.single('coverImage'),
    Movie.validatePOST,
    MovieController.createMovieReview,
  )
  .put(
    checkAccessToken,
    uploadBlog.single('coverImage'),
    Movie.validatePUT,
    MovieController.editMovieReview,
  )

router
  .route('/videos')
  .post(
    checkAccessToken,
    uploadVideo.single('video'),
    Video.validatePOST,
    PostController.createVideo,
  )

router
  .route('/videos/:postId')
  .put(
    checkAccessToken,
    uploadVideo.single('video'),
    Video.validatePUT,
    PostController.editVideo,
  )

router
  .route('/songs')
  .post(
    checkAccessToken,
    uploadAudio.single('audio'),
    Audio.validatePOST,
    PostController.createSong,
  )
  .put(
    checkAccessToken,
    uploadAudio.single('audio'),
    Audio.validatePUT,
    PostController.editSong,
  )

router
  .route('/podcasts')
  .post(
    checkAccessToken,
    uploadAudio.single('audio'),
    Audio.validatePOST,
    PostController.createPodcast,
  )

router
  .route('/podcasts/:postId')
  .put(
    checkAccessToken,
    uploadAudio.single('audio'),
    Audio.validatePUT,
    PostController.editPodcast,
  )

router
  .route('/discussions')
  .post(
    checkAccessToken,
    Discussion.validatePOST,
    DiscussionController.createDiscussion,
  )
  .put(
    checkAccessToken,
    Discussion.validatePUT,
    DiscussionController.editDiscussion,
  )

router
    .route('/tags')
    .get(paginate(), PostController.getPostsByTagsName);
  
router
  .route('/:postId')
  .get(PostController.getOnePost);

router
  .route('/users/:userId')
  .get(paginate({ limit: 15 }), PostController.getPosts);

router
  .route('/user/saved-posts')
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

module.exports = router;
