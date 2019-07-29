const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');

exports.deleteAndUploadImage = async (data, transformation = {}) => {
  try {
    const { oldImageId, newImage } = data;
    
    const isOk = await Promise.props({
      deletedOldImagerOnCloud: cloudinary.uploader.destroy(oldImageId),
      uploadedImage: cloudinary.uploader.upload(newImage, transformation),
    });

    if (
      isOk.deletedOldImagerOnCloud.result !==
        (oldImageId == 'null' ? 'not found' : 'ok') ||
      !isOk.uploadedImage
    ) {
      return false;
    }

    const uploadedImage = isOk.uploadedImage;
    return uploadedImage;
  } catch (error) {
    throw error;
  }
};
