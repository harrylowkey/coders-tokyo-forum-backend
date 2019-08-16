const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: require('./vars').cloudinary_name,
  api_key: require('./vars').cloudinary_api_key,
  api_secret: require('./vars').cloudinary_api_secret,
});

exports.upload = ({ 
  typeConfig, 
  typeUpload, 
  path, 
  fields }) => async (req, res, next,) => {
  let optionConfig = {};
  switch (typeConfig) {
    case 'video':
      optionConfig = require('../config/vars').videoConfig;
      break;
    case 'audio':
      optionConfig = require('../config/vars').audioConfig;
      break;
    case 'coverImage':
      optionConfig = require('../config/vars').coverImageConfig;
      break;
    case 'avatar':
      optionConfig = require('../config/vars').avatarConfig;
      break;
    case 'foodPhotos':
      optionConfig = require('../config/vars').foodPhotosConfig;
      break;
    default:
      break;
  }

  const config = {
    cloudinary,
    allowedFormats: ['jpg', 'png', 'jpeg'],
    ...optionConfig,
    filename: function(req, file, cb) {
      console.log(file);
      cb(undefined, file.originalname);
    },
  };

  const storage = cloudinaryStorage(config);
  const parse = multer({ storage });

  try {
    switch (typeUpload) {
      case 'single':
        console.log('dsfd');
        parse.single(path);
        break;
      case 'fields':
        parse.fields(fields);
        break;
      default:
        break;
    }
    console.log(req.file);
    return next();
  } catch (error) {
    console.log(error);
  }
};
