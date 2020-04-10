// config .env variables
const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
});

module.exports = {
  mongo_uri: process.env.MONGO_URI,
  port: process.env.PORT,
  admin_port: process.env.ADMIN_PORT,
  jwt_secret: process.env.JWT_SECRET,
  prefix: process.env.PREFIX,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRECT,
  videoConfig: {
    folder: 'Coders-Tokyo-Forum/posts/media',
    use_filename: true,
    unique_filename: true,
    resource_type: 'video',
    chunk_size: 15000000, //15mb,
    // async: true,
  },
  audioConfig: {
    folder: 'Coders-Tokyo-Forum/posts/media',
    use_filename: true,
    unique_filename: true,
    resource_type: 'video',
    chunk_size: 10000000, //10mb
    // async: true,
  },
  coverImageConfig: {
    folder: 'Coders-Tokyo-Forum/posts',
    use_filename: true,
    unique_filename: true,
    resource_type: 'image',
    chunk_size: 6000000, //6mb
    transformation: [
      {
        width: 1080,
        height: 730,
      },
    ],
  },
  avatarConfig: {
    folder: 'Coders-Tokyo-Forum/avatars',
    use_filename: true,
    unique_filename: true,
    resource_type: 'image',
    allowedFormats: ['jpg', 'png', 'jpeg'],
    chunk_size: 6000000, //6mb
    // async: true,
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
  },
  foodPhotosConfig: {
    folder: 'Coders-Tokyo-Forum/posts/foodReview',
    use_filename: true,
    unique_filename: true,
    resource_type: 'image',
    chunk_size: 6000000, //6mb
    // async: true,
    transformation: [
      {
        width: 760,
        height: 760,
      },
    ],
  },
  queues: {
    EMAIL_QUEUE: {
      name: 'emailQueue',
      prefix: '@@email_'
    },
    USER_QUEUE: {
      name: 'userQueue',
      prefix: '@@user_'
    } ,
    CLOUDINARY_QUEUE: {
      name: 'cloudinaryQueue',
      prefix: '@@cloudinaryPrefix_'
    },
    FILE_REFERENCE_QUEUE: {
      name: 'fileReferenceQueue',
      prefix: '@@fileReference_'
    } 
  },
  redis: {
    isCacheEnabled: true,
    host: '127.0.0.1',
    port: 6379
  },
  arena: {
    port: 3001,
    host: '127.0.0.1',
    basePath: '/arena',
    disableListen: false,
  }
};
