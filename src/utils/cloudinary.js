const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');

exports.deleteOldImageAndUploadNewImage = async (data, config = {}) => {
  const { oldImageId, newImage } = data;

  const result = await Promise.props({
    isDeleted: cloudinary.uploader.destroy(oldImageId),
    isUploaded: cloudinary.uploader.upload(newImage, config),
  });

  if (
    result.isDeleted.result !== (oldImageId == 'null' ? 'not found' : 'ok') ||
    !result.isUploaded
  ) {
    return false;
  }

  return result.isUploaded;
};

exports.uploadCoverImage = async coverImage => {
  const config = {
    folder: 'Coders-Tokyo-Forum/posts',
    use_filename: true,
    unique_filename: true,
    resource_type: 'image',
    transformation: [
      {
        width: 730,
        height: 480,
      },
    ],
  };

  return cloudinary.uploader.upload(coverImage, config);
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
