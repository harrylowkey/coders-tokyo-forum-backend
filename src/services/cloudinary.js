const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');
const Boom = require('@hapi/boom')
const { avatarConfig, blogCoverConfig, videoConfig, audioConfig } = require('@configVar')
const File = require('@models').File

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

exports.uploadFileProcess = async (user, data, newFile, fileType) => {
  const { FILE_REFERENCE_QUEUE, CLOUDINARY_QUEUE } = require('@bull')
  const cloudinaryFolder = fileType === '_avatar_' ? avatarConfig.folder : blogCoverConfig.folder
  const newFileName = `${user.username}${fileType}${newFile.originalname.split('.')[0]}`
  const newPath = cloudinaryFolder + '/' + newFileName + '_' + Math.floor(Date.now() / 1000);
  const newSecureURL = newFile.secure_url.replace(newFile.public_id, newPath);

  if (fileType === '_avatar_' && data.avatar) {
    const file = await File.findById(data.avatar._id).lean();
    FILE_REFERENCE_QUEUE.deleteFile.add({ file });
  } else {
    if (data.cover) {
      const file = await File.findById(data.cover._id).lean();
      FILE_REFERENCE_QUEUE.deleteFile.add({ file });
    }
  }

  const newFileCreated = await new File({
    secureURL: newSecureURL,
    publicId: newPath,
    fileName: newFileName,
    sizeBytes: newFile.bytes,
    userId: user._id,
    postId: data._id,
    resourceType: 'image'
  }).save();


  CLOUDINARY_QUEUE.renameFile.add({
    currentPath: newFile.public_id,
    newPath,
    fileId: newFileCreated.id,
    postId: data._id
  })

  return newFileCreated;
};

exports.uploadMediaProcess = async (user, data, newFileToUpload, fileType, config) => {
  const { FILE_REFERENCE_QUEUE, CLOUDINARY_QUEUE } = require('@bull')
  const newFile = await cloudinary.uploader.upload(newFileToUpload, config)
  const newFileName = `${user.username}${fileType}${newFile.original_filename}`
  const newPath = videoConfig.folder + '/' + newFileName + '_' + Math.floor(Date.now() / 1000);
  const newSecureURL = newFile.secure_url.replace(newFile.public_id, newPath);

  if (data.media) {
    const file = await File.findById(data.media._id).lean();
    FILE_REFERENCE_QUEUE.deleteFile.add({ file });
  }

  const newFileCreated = await new File({
    secureURL: newSecureURL,
    publicId: newPath,
    fileName: newFileName,
    sizeBytes: newFile.bytes,
    userId: user._id,
    postId: data._id,
    resourceType: 'video',
    media: {
      type: newFile.type,
      signature: newFile.signature,
      width: newFile.width,
      height: newFile.height,
      format: newFile.format,
      resource_type: newFile.resource_type,
      frame_rate: newFile.frame_rate,
      bit_rate: newFile.bit_rate,
      duration: newFile.duration,
    }
  }).save();

  CLOUDINARY_QUEUE.renameFile.add({
    currentPath: newFile.public_id,
    newPath,
    fileId: newFileCreated.id,
    postId: data._id,
    resourceType: 'video'
  })

  return newFileCreated;
};

