const express = require('express');
const router = express.Router();
const { UserController } = require('@controllers')
const { checkAccessToken } = require('@middlewares/authorize');
const {
  updateProfileValidate,
  uploadAvatarValidate,
} = require('../validations/user');


const { avatarConfig } = require('@configVar')
const { configStorage } = require('../../config/cloudinary')
const upload = configStorage(avatarConfig)

router
  .route('/:userId')
  .get(checkAccessToken, UserController.getById);
router
  .route('/:userId')
  .put(checkAccessToken,
    updateProfileValidate,
    UserController.updateProfile
  );
router
  .route('/avatars')
  .post(
    checkAccessToken,
    uploadAvatarValidate,
    upload.single('path'),
    UserController.uploadAvatar,
  );
router
  .route('/avatars')
  .delete(checkAccessToken, UserController.deleteAvatar);

router
  .route('/usernames/:username')
  .get(UserController.getByUsername);

module.exports = router;
