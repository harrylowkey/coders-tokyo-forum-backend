const express = require('express');
const multer = require('multer');
const { UserController } = require('@controllers')
const authorization = require('@middlewares/authorize');
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
  .get(authorization.checkAccessToken, UserController.getOne);
router
  .route('/:userId')
  .put(authorization.checkAccessToken,
    (req, res, next) => updateProfileValidate(req, res, next),
    UserController.updateProfile
  );
router
  .route('/:userId/avatars')
  .post(
    authorization.checkAccessToken,
    (req, res, next) => uploadAvatarValidate(req, res, next),
    upload.single('path'),
    UserController.uploadAvatar,
  );
router
  .route('/:userId/avatars')
  .delete(authorization.checkAccessToken, UserController.deleteAvatar);

router
  .route('/:username')
  .get(UserController.getByUsername);

module.exports = router;
