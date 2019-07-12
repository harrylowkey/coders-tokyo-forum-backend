const express = require('express');

const router = express.Router();

router.route('/test').get(() => console.log('success'));

module.exports = router;
