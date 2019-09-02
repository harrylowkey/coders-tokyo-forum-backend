const Boom = require('@hapi/boom');
const { redis } = require('./config/vars');
const Queue = require('bull');
const Utils = require('../src/utils/email');

const emailQueue = {
  send_welcome_email: new Queue('send_welcome_email_queue', redis),
  send_verify_code: new Queue('send_verify_code', redis),
}
const userQueue = new Queue('user_que', redis);
const cloudinaryQueue = new Queue('cloudinary_queue', redis);
const filereferenceQueue = new Queue('filereference_queue', redis);

emailQueue.send_welcome_email.process(async (job, done) => {
  try {
    console.log('&&&&&&&&&&&&&&&&&&&')
    const { email, username } = job;
    const result = await Utils.sendEmailWelcome(email, username)
    done(null, result);
  } catch (e) {
    console.log('Exception in send welcome email queue', e)
    done(e, null);
  }
})

module.exports = {
  emailQueue,
  userQueue,
  cloudinaryQueue,
  filereferenceQueue
}
