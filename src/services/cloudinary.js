const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');
const Boom = require('@hapi/boom')
const { avatarConfig, blogCoverConfig, videoConfig, audioConfig } = require('@configVar')
const File = require('@models').File


exports.uploadAndDeleteFileProcess = async (user, data, newFile, fileType) => {
  const { FILE_REFERENCE_QUEUE, CLOUDINARY_QUEUE } = require('@bull')
  // const cloudinaryFolder = fileType === '_avatar_' ? avatarConfig.folder : blogCoverConfig.folder
  const newFileName = `${user.username}${fileType}${newFile.originalname.split('.')[0]}`
  // const newPath = cloudinaryFolder + '/' + newFileName + '_' + Math.floor(Date.now() / 1000);
  // const newSecureURL = newFile.secure_url.replace(newFile.public_id, newPath);

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
    secureURL: newFile.secure_url,
    publicId: newFile.public_id,
    fileName: newFileName,
    sizeBytes: newFile.bytes,
    user: user._id,
    postId: data._id,
    resourceType: newFile.resource_type
  }).save();


  // CLOUDINARY_QUEUE.renameFile.add({
  //   currentPath: newFile.public_id,
  //   newPath,
  //   fileId: newFileCreated._id,
  //   postId: data._id
  // })

  return newFileCreated;
};

exports.uploadMediaProcess = async (user, data, newFileToUpload, fileType, config) => {
  const { FILE_REFERENCE_QUEUE, CLOUDINARY_QUEUE } = require('@bull')
  const newFile = await cloudinary.uploader.upload(newFileToUpload.path, config)
  const newFileName = `${user.username}${fileType}${newFileToUpload.originalname.split('.')[0]}`
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
    user: user._id,
    postId: data._id,
    resourceType: newFile.resource_type,
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
    fileId: newFileCreated._id,
    postId: data._id,
    resourceType: newFile.resource_type
  })

  return newFileCreated;
};

exports.uploadFileProcess = async (user, newFileToUpload, resourceType, fileType, config, postId = null) => {
  // const { CLOUDINARY_QUEUE } = require('@bull')
  const newFile = await cloudinary.uploader.upload(newFileToUpload.path, config)
  const newFileName = `${user.username}_${fileType}_${newFileToUpload.originalname.split('.')[0]}`
  // const newPath = config.folder + '/' + newFileName + '_' + Math.floor(Date.now() / 1000);
  // const newSecureURL = newFile.secure_url.replace(newFile.public_id, newPath);

  let newFileCreated
  if (resourceType === 'image') {
    newFileCreated = await new File({
      secureURL: newFile.secure_url,
      publicId: newFile.public_id,
      fileName: newFileName,
      user: user._id,
      resourceType
    }).save();
  }

  if (resourceType === 'video') {
    newFileCreated = await new File({
      secureURL: newFile.secure_url,
      publicId: newFile.public_id,
      fileName: newFileName,
      sizeBytes: newFile.bytes,
      user: user._id,
      postId,
      resourceType: newFile.resource_type,
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
  }

  // CLOUDINARY_QUEUE.renameFile.add({
  //   currentPath: newFile.public_id,
  //   newPath,
  //   fileId: newFileCreated._id,
  //   postId: '',
  //   resourceType: newFile.resource_type
  // })

  return newFileCreated;
}

exports.uploadMultipleFiles = async (user, files, fileType, config = {}) => {
  const { CLOUDINARY_QUEUE } = require('@bull')
  const uploadImagePromise = image => {
    return new Promise((resolve, reject) => {
      try {
        const uploadedImage = cloudinary.uploader.upload(image.path, config);
        return resolve(uploadedImage);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const uploadImagePromises = files.map(image => uploadImagePromise(image));
  const images = await Promise.all(uploadImagePromises);

  const foodPhotos = images.map(photo => {
    const newFileName = `${user.username}${fileType}${photo.original_filename.split('.')[0]}`
    // const newPath = config.folder + '/' + newFileName + '_' + Math.floor(Date.now() / 1000);
    // const newSecureURL = photo.secure_url.replace(photo.public_id, newPath);
    const resourceType = photo.resource_type
    return {
      secureURL: photo.secure_url,
      publicId: photo.public_id,
      fileName: newFileName,
      user: user._id,
      resourceType
    }
  })

  const data = await File.insertMany(foodPhotos)
  // data.map((image, index) => {
  //   CLOUDINARY_QUEUE.renameFile.add({
  //     currentPath: images[index].public_id,
  //     newPath: image.publicId,
  //     fileId: image._id,
  //     postId: '',
  //     resourceType: image.resourceType
  //   })
  // })
  console.log(data)
  return data
};
