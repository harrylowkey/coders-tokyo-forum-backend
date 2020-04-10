const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');
const Boom = require('@hapi/boom')
const { avatarConfig } = require('@configVar')
const { File } = require('@models')

exports.updateAvatarProcess = async (userAvatar, newAvatar) => {
  const newPath = avatarConfig.folder + '/' + newAvatar.public_id.split('/').pop();
  const newSecureURL = newAvatar.secure_url.replace(newAvatar.public_id, newPath);

  if (user.avatar) {
    const avatar = await File.findById(user.avatar._id);
    //TODO: Bull Queue task
    // await this.fileReferenceQueue.add(
    //   fileReferenceQueueJob.deleteAvatarReference,
    //   avatar,
    // );
    // if (
    //   result.isDeleted.result !== (oldAvatarId ? 'not found' : 'ok') ||
    //   !result.isUploaded
    // ) {
    //   return false;
    // }
  }

  const newFile = new File({
    secureURL: newSecureURL,
    publicId: newPath,
    fileName: newAvatar.originalname,
    sizeBytes: file.bytes,
    userId: user._id,
  });

  try {
    const [fileReference, _] = await Promise.all([
      newFile.save(),
      // this.cloudinaryQueue.add(cloudinaryQueueJob.moveAvatar, {
      //   currentPath: file.public_id,
      //   newPath,
      // }),
    ]);

    return fileReference;
  } catch (e) {
    // await this.fileReferenceQueue.add(
    //   fileReferenceQueueJob.deleteAvatarReference,
    //   { ...newFile, publicId: file.public_id },
    // );
    throw Boom.badRequest('Error uploading avatar')
  }


  return result.isUploaded;
};

exports.uploadManyImages = async (images, config = {}) => {
  const uploadImagePromise = image => {
    return new Promise((resolve, reject) => {
      try {
        const uploadedImage = cloudinary.uploader.upload(image, config);
        return resolve(uploadedImage);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const uploadImagePromises = images.map(image => uploadImagePromise(image));
  return Promise.all(uploadImagePromises);
};

exports.deteteManyImages = async photos => {
  const deleteImagePromise = image => {
    return new Promise((resolve, reject) => {
      try {
        const deletedImage = cloudinary.uploader.destroy(image);
        return resolve(deletedImage);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const deleteImagePromises = photos.map(photo => deleteImagePromise(photo));
  return Promise.all(deleteImagePromises);
};

exports.deleteOldVideoAndUploadNewVideo = async (data, config = {}) => {
  const { oldVideoId, newVideo } = data;

  const result = await Promise.props({
    isDeleted: cloudinary.uploader.destroy(oldVideoId, {
      resource_type: 'video',
    }),
    isUploaded: cloudinary.uploader.upload(newVideo, config),
  });

  if (
    result.isDeleted.result !== (oldVideoId == 'null' ? 'not found' : 'ok') ||
    !result.isUploaded
  ) {
    return false;
  }

  return result.isUploaded;
};
