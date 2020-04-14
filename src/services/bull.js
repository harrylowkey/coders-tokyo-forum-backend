const Queue = require('bull');
const cloudinary = require('cloudinary').v2;
const { QUEUES } = require('@configVar');
const { MailerService } = require('@services')
const { File, Post } = require('@models')

const UESR_QUEUE = new Queue(`${QUEUES.USER_QUEUE.name}`, QUEUES.USER_QUEUE.options);
const CLOUDINARY_QUEUE = {
  deleteAsset: new Queue(`${QUEUES.CLOUDINARY_QUEUE.name}:delete_assset`, QUEUES.CLOUDINARY_QUEUE.options),
  renameFile: new Queue(`${QUEUES.CLOUDINARY_QUEUE.name}:rename_file`, QUEUES.CLOUDINARY_QUEUE.options),
}
const FILE_REFERENCE_QUEUE = {
  deleteFile: new Queue(`${QUEUES.FILE_REFERENCE_QUEUE.name}:delete_file`, QUEUES.FILE_REFERENCE_QUEUE.options),
  deleteMultipleFiles: new Queue(`${QUEUES.FILE_REFERENCE_QUEUE.name}:delete_mmultipleFiles`, QUEUES.FILE_REFERENCE_QUEUE.options)
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
  const { data: { publicId, resourceType } } = job;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    done(null, result)
  } catch (error) {
    console.log('Exception when deleting asset on Cloudinary', error);
    done(error, null);
  }
})

CLOUDINARY_QUEUE.renameFile.process(async (job, done) => {
  const { data: { currentPath, newPath, fileId, postId, resourceType } } = job
  try {
    const result = await cloudinary.uploader.rename(currentPath, newPath, { resource_type: resourceType });
    done(null, result)
  } catch (error) {
    console.log('Exception when renaming file on Cloudinary', error);
    await Promise.all([
      File.findByIdAndDelete(fileId),
      Post.findByIdAndUpdate(postId, { $set: { media: null } }, { new: true }),
      CLOUDINARY_QUEUE.deleteAsset.add({ publicId: currentPath, resourceType }),
    ]);
    done(error, null);
  }
})

FILE_REFERENCE_QUEUE.deleteFile.process(async (job, done) => {
  try {
    const { data: { file } } = job;
    if (!file) return done(null)
    CLOUDINARY_QUEUE.deleteAsset.add({ publicId: file.publicId, resourceType: file.resourceType })
    const result = await File.findByIdAndDelete(file._id)
    done(null, result);
  } catch (e) {
    console.log('Exception when deleting file in DATABASE', e);
    done(e, null);
  }
})

/**
 * files = [{ _id, sercureURL, publicId }]
 */

FILE_REFERENCE_QUEUE.deleteMultipleFiles.process(async (job, done) => {
  try {
    const { data: { files } } = job;
    if (!files.length) return done(null)
    const result = await File.deleteMany({
      _id: {
        $in: files.map(file => file._id)
      }
    })
    files.map(file => {
      CLOUDINARY_QUEUE.deleteAsset.add({ publicId: file.publicId, resourceType: file.resourceType })
    })
    done(null, result)
  } catch (e) {
    console.log('Exception when deleting file in DATABASE', e);
    done(e, null);
  }
})

//TODO: Implement logger package
EMAIL_QUEUE.sendEmailCode.on('completed', (job, result) => {
  console.log('****__QUEUE_JOB__**** Send email code success')
})

CLOUDINARY_QUEUE.renameFile.on('completed', (job, result) => {
  if (!result)
    console.log('****__QUEUE_JOB__**** Cloudinary renamed file FAILED')

  if (result)
    console.log('****__QUEUE_JOB__**** Cloudinary renamed file SUCCESS')
})

CLOUDINARY_QUEUE.deleteAsset.on('completed', (job, result) => {
  if (result.result === 'not found')
    console.log('****__QUEUE_JOB__**** Cloudinary deleted asset FAILED')

  if (result.result === 'ok')
    console.log('****__QUEUE_JOB__**** Cloudinary deleted asset SUCCESS')
})

FILE_REFERENCE_QUEUE.deleteFile.on('completed', (job, result) => {
  if (!result)
    console.log('****__QUEUE_JOB__**** FileReference deleted file in DATABASE FAILED')

  if (result)
    console.log('****__QUEUE_JOB__**** FileReference deleted file in DATABASE SUCCESS')
})

FILE_REFERENCE_QUEUE.deleteMultipleFiles.on('completed', (job, result) => {
  if (!result)
    console.log('****__QUEUE_JOB__**** FileReference deleted file in DATABASE FAILED')

  if (result)
    console.log('****__QUEUE_JOB__**** FileReference deleted file in DATABASE SUCCESS')
})



module.exports = {
  EMAIL_QUEUE,
  UESR_QUEUE,
  CLOUDINARY_QUEUE,
  FILE_REFERENCE_QUEUE
}
