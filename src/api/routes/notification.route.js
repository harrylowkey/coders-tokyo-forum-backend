const express = require('express');

const { checkAccessToken } = require('@middlewares/authorize');
const notifController = require('../controllers/notification.controller');

const router = express.Router();

router.route('/').get(checkAccessToken, notifController.getNotifs);

module.exports = router;
