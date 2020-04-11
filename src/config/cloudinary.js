const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

exports.config = () => {
  cloudinary.config({
    cloud_name: require('../config/vars').cloudinary_name,
    api_key: require('../config/vars').cloudinary_api_key,
    api_secret: require('../config/vars').cloudinary_api_secret,
  });
};


exports.configStorage = (dataConfig) => {
  const storage = cloudinaryStorage({
    ...dataConfig,
    cloudinary,
    filename: function (req, file, cb) {
      cb(undefined, file.originalname);
    }
  });
  const upload = multer({ storage });
  return upload
}