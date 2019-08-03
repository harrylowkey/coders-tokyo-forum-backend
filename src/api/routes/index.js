const express = require('express');
const router = express.Router();

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const postRoute = require('./post.route');
const likeRoute = require('./like.route');

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/posts', postRoute);
router.use('/like', likeRoute);

module.exports = router;
