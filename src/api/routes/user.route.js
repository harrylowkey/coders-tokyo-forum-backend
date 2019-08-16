const express = require('express');
const validate = require('express-validation');
const multer = require('multer');

const userController = require('../controllers/user.controller');
const authorization = require('../../middlewares/authorize');
const multerCloudinary = require('../../config/multer-cloudinary');

const router = express.Router();
// var storage = multer.diskStorage({
//   filename: function(req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

router
  .route('/:userId')
  .get(authorization.checkAccessToken, userController.getOneUser);
router
  .route('/:userId')
  .put(authorization.checkAccessToken, userController.updateProfile);
router
  .route('/:userId/avatars')
  .post(
    authorization.checkAccessToken,
    // upload.single('path'),
    userController.uploadAvatar,
  );
router
  .route('/:userId/avatar')
  .delete(authorization.checkAccessToken, userController.deleteAvatar);

module.exports = router;
