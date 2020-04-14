const express = require('express');
const { checkAccessToken } = require('@middlewares/authorize');
const FileController = require('../controllers/file.controller');
const { foodPhotosConfig } = require('@configVar')

const {
  uploadVideo,
  uploadAudio,
  uploadFood,
  uploadAvatar,
  uploadBlogCover
} = require('../../config/cloudinary').configMulter


const router = express.Router();

router
  .route('/:fileId')
  .delete(checkAccessToken, FileController.deleteFile);

router
  .route('/:fileId')
  .get(checkAccessToken, FileController.getFile);

router
  .route('/delete')
  .delete(checkAccessToken, FileController.uploadMultipleFoodPhotos)
router
  .route('/upload/avatar')
  .post(checkAccessToken, uploadAvatar.single('file'), FileController.uploadFile)

router
  .route('/upload/video')
  .post(checkAccessToken, uploadVideo.single('file'), FileController.uploadFile)

router
  .route('/upload/audio')
  .post(checkAccessToken, uploadAudio.single('file'), FileController.uploadFile)

router
  .route('/upload/blogCover')
  .post(checkAccessToken, uploadBlogCover.single('file'), FileController.uploadFile)


//FIXME: Client must validate photos maximum. BE still can not validate input photos maximum
router
  .route('/upload/foodPhotos')
  .post(checkAccessToken, uploadBlogCover.array('files', foodPhotosConfig.maxPhotos), FileController.uploadMultipleFoodPhotos)

router
  .route('/delete/multipleFiles')
  .delete(checkAccessToken, FileController.deleteMultipleFiles)

module.exports = router;
