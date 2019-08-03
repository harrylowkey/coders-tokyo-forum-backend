const express = require('express');
const router = express.Router();

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const postRoute = require('./post.route');
const streamRoute = require('./stream.route');

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/posts', postRoute);
router.use('/stream', streamRoute);

module.exports = router;
