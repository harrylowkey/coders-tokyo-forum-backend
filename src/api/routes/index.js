const express = require('express');

const router = express.Router();

const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const postRoute = require('./post.route');
const streamRoute = require('./stream.route');
const commentRoute = require('./comment.route');
const fileRoute = require('./file.route');
const notifRoute = require('./notification.route');

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/posts', postRoute);
router.use('/stream', streamRoute);
router.use('/comments', commentRoute);
router.use('/files', fileRoute);
router.use('/notifications', notifRoute);

module.exports = router;

const z = 'z';