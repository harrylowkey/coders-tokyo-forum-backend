const express = require('express');
const validate = require('express-validation');
const multer  = require('multer');

const userController = require('../controllers/user.controller');
const authorization = require('../../middlewares/authorize');

const router = express.Router();
var storage = multer.diskStorage(
  {
      filename: function ( req, file, cb ) {
          cb( null, file.originalname);
      }
  }
);

const upload = multer({ storage: storage });

router.route('/:userId').get(authorization.checkAccessToken ,userController.getOneUser);
router.route('/:userId').put(authorization.checkAccessToken, userController.updateProfile);
router.route('/:userId/update-avatar').put(authorization.checkAccessToken, upload.single('path'), userController.updateAvatar);

module.exports = router;