const express = require('express');
const { AuthController } = require('@controllers');
const { checkAccessToken } = require('@middlewares/authorize');
const {
  signUpValidate,
  loginValidate,
  emailCodeValidate,
  changePasswordValidate,
  forgotPasswordValidate,
} = require('../validations/auth');

const router = express.Router();

router.route('/signup').post(signUpValidate, AuthController.register);
router.route('/signin').post(loginValidate, AuthController.login);
router
  .route('/forgot-password')
  .put(forgotPasswordValidate, AuthController.forgotPassword);
router
  .route('/send-verify-code')
  .post(emailCodeValidate, AuthController.sendEmailVerifyCode);
router
  .route('/change-password')
  .put(checkAccessToken, changePasswordValidate, AuthController.changePassword);

module.exports = router;
