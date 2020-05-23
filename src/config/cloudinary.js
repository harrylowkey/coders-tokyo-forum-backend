const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');
const { blogCoverConfig, 
        audioConfig, 
        foodPhotosConfig, 
        videoConfig,
        avatarConfig,
        photoConfig
      } = require('@configVar')

exports.config = () => {
  cloudinary.config({
    cloud_name: require('@configVar').cloudinary_name,
    api_key: require('@configVar').cloudinary_api_key,
    api_secret: require('@configVar').cloudinary_api_secret,
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

const videoStorage = multer.diskStorage(videoConfig)
const uploadVideo = multer({ storage: videoStorage })

const audioStorage = multer.diskStorage(audioConfig)
const uploadAudio = multer({ storage: audioStorage })

const foodStorage = multer.diskStorage(foodPhotosConfig)
const uploadFood = multer({ storage: foodStorage })

const blogCoverStorage = multer.diskStorage(blogCoverConfig)
const uploadBlogCover = multer({ storage: blogCoverStorage })

const avatarStorage = multer.diskStorage(avatarConfig)
const uploadAvatar = multer({ storage: avatarStorage })

const photoStorage = multer.diskStorage(photoConfig)
const uploadPhoto = multer({ storage: photoStorage })

exports.configMulter = {
  uploadVideo,
  uploadAudio,
  uploadFood,
  uploadAvatar,
  uploadBlogCover,
  uploadPhoto
}