const express = require('express');
const validate = require('express-validation');

const authController = require('../controllers/auth.controller');
const { login, register } = require('../validations/auth.validation');

const router = express.Router();

router.route('/register').post(validate(register), authController.register);
router.route('/login').post(validate(login), authController.login)

module.exports = router;
