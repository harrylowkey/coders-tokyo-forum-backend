const express = require('express');
const { checkAccessToken } = require('@middlewares/authorize');
const FileController = require('../controllers/file.controller');

const router = express.Router();

router
  .route('/:fileId')
  .delete(checkAccessToken, FileController.deleteFile);

router
  .route('/:fileId')
  .get(checkAccessToken, FileController.getFile);

module.exports = router;
