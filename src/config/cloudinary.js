const cloudinary = require('cloudinary').v2;

exports.config = () => {
  cloudinary.config({
    cloud_name: require('./vars').cloudinary_name,
    api_key: require('./vars').cloudinary_api_key,
    api_secret: require('./vars').cloudinary_api_secret,
  });
};
