const express = require('express');
const router = express.Router();

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const postRoute = require('./post.route');

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/posts', postRoute);

module.exports = router;
