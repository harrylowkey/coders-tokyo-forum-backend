const Queue = require('bull');
const cloudinary = require('cloudinary').v2;
const { QUEUES } = require('./vars');
const { MailerService } = require('@services')
const { File } = require('@models')

const UESR_QUEUE = new Queue(`${QUEUES.USER_QUEUE.name}`, QUEUES.USER_QUEUE.options);
const CLOUDINARY_QUEUE = {
  deleteAsset: new Queue(`${QUEUES.CLOUDINARY_QUEUE.name}:delete_assset`, QUEUES.CLOUDINARY_QUEUE.options),
  moveAvatarFile: new Queue(`${QUEUES.CLOUDINARY_QUEUE.name}:move-avatar-file`, QUEUES.CLOUDINARY_QUEUE.options)
}
const FILE_REFERENCE_QUEUE = {
  deleteAvatar: new Queue(`${QUEUES.FILE_REFERENCE_QUEUE.name}:delete_avatar`, QUEUES.FILE_REFERENCE_QUEUE.options)
}
const EMAIL_QUEUE = {
  sendWelcomeEmail: new Queue(`${QUEUES.EMAIL_QUEUE.name}:send_welcome_email`, QUEUES.EMAIL_QUEUE.options),
  sendEmailCode: new Queue(`${QUEUES.EMAIL_QUEUE.name}:send_verify_code`, QUEUES.EMAIL_QUEUE.options),
}

EMAIL_QUEUE.sendWelcomeEmail.process(async (job, done) => {
  try {
    const { data } = job;
    MailerService.sendEmail(data, 'SIGN_UP')
  } catch (e) {
    console.log('Exception when sending welcome email queue', e);
    done(e, null);
  }
})

EMAIL_QUEUE.sendEmailCode.process(async (job, done) => {
  try {
    const { data } = job;
    await MailerService.sendEmail(data, 'VERIFY_CODE');
  } catch (e) {
    console.log('Exception when sending verify email queue', e);
    done(e, null);
  }
})

CLOUDINARY_QUEUE.deleteAsset.process(async (job, done) => {
  const { data: { publicId} } = job;
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    done(null, result)
  } catch (error) {
    console.log('Exception when deleting avatar on Cloudinary', e);
    done(error, null);
  }
})

CLOUDINARY_QUEUE.moveAvatarFile.process(async (job, done) => {
  const { data: { currentPath, newPath, fileId } } = job
  try {
    const result = await cloudinary.uploader.rename(currentPath, newPath);
    done(null, result)
  } catch (error) {
    console.log('Exception when renaming avatar on Cloudinary', error);
    console.log('currentPath', currentPath)
    await Promise.all([
      File.findByIdAndDelete(fileId),
      CLOUDINARY_QUEUE.deleteAsset.add({ publicId: currentPath }),
    ]);
    done(error, null);
  }
})

FILE_REFERENCE_QUEUE.deleteAvatar.process(async (job, done) => {
  try {
    const { data: { avatar } } = job;
    CLOUDINARY_QUEUE.deleteAsset.add({ publicId: avatar.publicId })
    const result = await File.findByIdAndDelete(avatar._id)
    done(null, result);
  } catch (e) {
    console.log('Exception when deleting avatar in DATABASE', e);
    done(e, null);
  }
})

EMAIL_QUEUE.sendEmailCode.on('completed', (job, result) => {
  console.log('****__QUEUE_JOB__**** Send email code success')
})

CLOUDINARY_QUEUE.moveAvatarFile.on('completed', (job, result) => {
  if (result.result === 'not found')
    console.log('****__QUEUE_JOB__**** Cloudinary moved avatar FAILED')

  if (result.result === 'ok')
    console.log('****__QUEUE_JOB__**** Cloudinary moved avatar SUCCESS')
})

CLOUDINARY_QUEUE.deleteAsset.on('completed', (job, result) => {
  if (result.result === 'not found')
    console.log('****__QUEUE_JOB__**** Cloudinary deleted asset FAILED')

  if (result.result === 'ok')
    console.log('****__QUEUE_JOB__**** Cloudinary deleted asset SUCCESS')
})

FILE_REFERENCE_QUEUE.deleteAvatar.on('completed', (job, result) => {
  if (!result) 
    console.log('****__QUEUE_JOB__**** FileReference deleted avatar in DATABASE FAILED')
  
  if (result)
    console.log('****__QUEUE_JOB__**** FileReference deleted avatar in DATABASE SUCCESS')
})


module.exports = {
  EMAIL_QUEUE,
  UESR_QUEUE,
  CLOUDINARY_QUEUE,
  FILE_REFERENCE_QUEUE
}
