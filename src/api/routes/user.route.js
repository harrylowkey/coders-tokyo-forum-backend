const express = require('express');
const multer = require('multer');
const { UserController } = require('@controllers')
const { checkAccessToken } = require('@middlewares/authorize');
const {
  updateProfileValidate,
  uploadAvatarValidate,
} = require('../validations/user');

const router = express.Router();
var storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router
  .route('/:userId')
  .get(checkAccessToken, UserController.getOne);
router
  .route('/:userId')
  .put(checkAccessToken,
    updateProfileValidate,
    UserController.updateProfile
  );
router
  .route('/:userId/avatars')
  .post(
    checkAccessToken,
    uploadAvatarValidate,
    upload.single('path'),
    UserController.uploadAvatar,
  );
router
  .route('/:userId/avatars')
  .delete(checkAccessToken, UserController.deleteAvatar);

router
  .route('/:username')
  .get(UserController.getByUsername);

module.exports = router;
