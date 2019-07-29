const cloudinary = require('cloudinary').v2;
const Promise = require('bluebird');

exports.deleteOldAvaAndUploadNewAva = async data => {
  try {
    const { oldImageId, newImage } = data;
    const config = {
      folder: 'Coders-Tokyo-Forum/avatars',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image',
      transformation: [
        {
          width: 400,
          height: 400,
          gravity: 'face',
          radius: 'max',
          crop: 'crop',
        },
        { width: 200, crop: 'scale' },
      ],
    };

    const result = await Promise.props({
      idDeleted: cloudinary.uploader.destroy(oldImageId),
      isUploaded: cloudinary.uploader.upload(newImage, config),
    });

    if (
      result.idDeleted.result !== (oldImageId == 'null' ? 'not found' : 'ok') ||
      !result.isUploaded
    ) {
      return false;
    }

    return result.isUploaded;
  } catch (error) {
    throw error;
  }
};
