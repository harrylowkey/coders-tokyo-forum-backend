const express = require('express');
const validate = require('express-validation');

const userController = require('../controllers/user.controller');
const authorization = require('../../middlewares/authorize');

const router = express.Router();

router.route('/:userId').get(authorization.checkAccessToken ,userController.getOneUser);

module.exports = router;