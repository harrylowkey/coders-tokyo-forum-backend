const express = require('express');
const { checkAccessToken } = require('@middlewares/authorize');
const streamController = require('../controllers/stream.controller');

const router = express.Router();

router
  .route('/:fileId')
  .delete(checkAccessToken, fileController.deleteFile);

router
  .route('/:fileId')
  .get(checkAccessToken, fileController.getFile);

module.exports = router;
