const express = require('express');

const router = express.Router();
const { UserController } = require('@controllers');
const { checkAccessToken } = require('@middlewares/authorize');
const { avatarConfig } = require('@configVar');
const {
  updateProfileValidate,
  uploadAvatarValidate,
} = require('../validations/user');


const { configStorage } = require('../../config/cloudinary');

const upload = configStorage(avatarConfig);

router
  .route('/:userId')
  .get(checkAccessToken, UserController.getById);

router
  .route('/profile/:username')
  .get(UserController.getByUsername);

router
  .route('/')
  .put(checkAccessToken,
    updateProfileValidate,
    UserController.updateProfile);
router
  .route('/avatars')
  .post(
    checkAccessToken,
    uploadAvatarValidate,
    UserController.uploadAvatar,
  );
router
  .route('/avatars')
  .delete(checkAccessToken, UserController.deleteFile);

router
  .route('/usernames/:username')
  .get(checkAccessToken, UserController.getByUsername);

router
  .route('/:userId/follow')
  .post(checkAccessToken, UserController.follow);

router
  .route('/:userId/unfollow')
  .post(checkAccessToken, UserController.unfollow);

router
  .route('/:userId/followers')
  .get(UserController.getFollowers);

router
  .route('/:userId/following')
  .get(UserController.getFollowing);

module.exports = router;
