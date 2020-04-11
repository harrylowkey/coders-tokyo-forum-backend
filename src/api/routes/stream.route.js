const express = require('express');

const paginate = require('@middlewares/pagination');
const streamController = require('../controllers/stream.controller');

const router = express.Router();

router.route('/').get(paginate({ limit: 5 }), streamController.index);

module.exports = router;
