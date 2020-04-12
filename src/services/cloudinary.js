const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');
const Boom = require('@hapi/boom')
const { avatarConfig } = require('@configVar')
const File = require('@models').File

exports.updateAvatarProcess = async (user, newAvatar) => {
  const { FILE_REFERENCE_QUEUE, CLOUDINARY_QUEUE } = require('@bull')
  const newFileName = `${user.username}_avatar_${newAvatar.originalname.split('.')[0]}_`
  const newPath = avatarConfig.folder + '/' + newFileName + Math.floor(Date.now() / 1000);
  const newSecureURL = newAvatar.secure_url.replace(newAvatar.public_id, newPath);

  if (user.avatar) {
    const avatar = await File.findById(user.avatar._id).lean();
    FILE_REFERENCE_QUEUE.deleteAvatar.add({ avatar });
  }

  const newFile = await new File({
    secureURL: newSecureURL,
    publicId: newPath,
    fileName: newFileName + newAvatar.originalname,
    sizeBytes: newAvatar.bytes,
    userId: user._id,
  }).save();

  CLOUDINARY_QUEUE.moveAvatarFile.add({
    currentPath: newAvatar.public_id,
    newPath,
    fileId: newFile.id
  })

  return newFile;
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
