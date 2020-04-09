const express = require('express');
const {
  signUpValidate,
  loginValidate,
  emailCodeValidate,
  changePasswordValidate,
  forgotPasswordValidate,
} = require('../validations/auth');
const { AuthController } = require('@controllers');
const authorization = require('@middlewares/authorize');

const router = express.Router();

router.route('/register').post((req, res, next) => signUpValidate(req, res, next), AuthController.register);
router.route('/login').post((req, res, next) => loginValidate(req, res, next), AuthController.login);
router
  .route('/forgot-password')
  .put((req, res, next) => forgotPasswordValidate(req, res, next), AuthController.forgotPassword);
router
  .route('/send-verify-code')
  .post((req, res, next) => emailCodeValidate(req, res, next), AuthController.sendEmailVerifyCode);
router
  .route('/change-password')
  .put(authorization.checkAccessToken, (req, res, next) => changePasswordValidate(req, res, next), AuthController.changePassword);

module.exports = router;
