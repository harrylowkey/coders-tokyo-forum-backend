const express = require('express');
const { checkAccessToken } = require('@middlewares/authorize');
const { foodPhotosConfig } = require('@configVar');
const FileController = require('../controllers/file.controller');

const {
  uploadVideo,
  uploadAudio,
  uploadFood,
  uploadAvatar,
  uploadBlogCover,
} = require('../../config/cloudinary').configMulter;


const router = express.Router();

router
  .route('/:fileId')
  .delete(checkAccessToken, FileController.deleteFile);

router
  .route('/:fileId')
  .get(checkAccessToken, FileController.getFile);

router
  .route('/:fileId')
  .delete(checkAccessToken, FileController.uploadMultipleFoodPhotos);
router
  .route('/upload/avatar')
  .post(checkAccessToken, uploadAvatar.single('avatar'), FileController.uploadFile);

router
  .route('/upload/video')
  .post(checkAccessToken, uploadVideo.single('file'), FileController.uploadFile);

router
  .route('/upload/audio')
  .post(checkAccessToken, uploadAudio.single('file'), FileController.uploadFile);

router
  .route('/upload/cover')
  .post(checkAccessToken, uploadBlogCover.single('cover'), FileController.uploadFile);

router
  .route('/upload/photo')
  .post(checkAccessToken, uploadBlogCover.single('photo'), FileController.uploadFile);

router
  .route('/upload/foodPhotos')
  .post(checkAccessToken, uploadBlogCover.array('file', foodPhotosConfig.maxPhotos), FileController.uploadMultipleFoodPhotos);

router
  .route('/delete/multipleFiles')
  .delete(checkAccessToken, FileController.deleteMultipleFiles);

module.exports = router;
