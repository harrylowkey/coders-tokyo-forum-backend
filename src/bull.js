const Boom = require('@hapi/boom');
const { redis } = require('./config/vars');
const Queue = require('bull');
const { MailerService } = require('@services')

const EMAIL_QUEUE = {
  sendWelcomeEmail: new Queue('send_welcome_email_queue', redis),
  sendEmailCode: new Queue('send_verify_code', redis),
}
const userQueue = new Queue('user_que', redis);
const cloudinaryQueue = new Queue('cloudinary_queue', redis);
const filereferenceQueue = new Queue('filereference_queue', redis);

EMAIL_QUEUE.sendWelcomeEmail.process(async (job, done) => {
  try {
    const { data } = job;
    const result = MailerService.sendEmail(data, 'SIGN_UP')
    done(null, result);
  } catch (e) {
    console.log('Exception in send welcome email queue', e);
    done(e, null);
  }
})

EMAIL_QUEUE.sendEmailCode.process(async (job, done) => {
  try {
    const { data } = job;
    const result = await MailerService.sendEmail(data, 'VERIFY_CODE');
    done(null, result);
  } catch (e) {
    console.log('Exception in send verify email queue', e);
    done(e, null);
  }
})

module.exports = {
  EMAIL_QUEUE,
  userQueue,
  cloudinaryQueue,
  filereferenceQueue
}
