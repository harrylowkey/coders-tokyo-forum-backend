const express = require('express');

const { checkAccessToken } = require('@middlewares/authorize');
const notifController = require('../controllers/notification.controller');

const router = express.Router();

router.route('/').get(checkAccessToken, notifController.getNotifs);

router
  .route('/:id/markAsRead')
  .post(checkAccessToken, notifController.markAsRead);

  router
  .route('/markMultipleAsRead')
  .post(checkAccessToken, notifController.markMultipleAsRead);

module.exports = router;
