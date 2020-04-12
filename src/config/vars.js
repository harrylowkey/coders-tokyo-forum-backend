const path = require('path')
let mode = process.env.NODE_ENV || 'local'
let _path = `${path.join(__dirname, '../../.env')}.${mode}`

require('dotenv').config({ path: _path })
module.exports = {
  mongo_uri: process.env.MONGO_URL,
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
    use_filename: false,
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
    use_filename: false,
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
  QUEUES: {
    EMAIL_QUEUE: {
      name: 'email',
      options: {
        defaultJobOptions: {
          attempts: 5,
          timeout: 10000,
        },
        prefix: '@@email_',
      }
    },
    USER_QUEUE: {
      name: 'user',
      options: {
        defaultJobOptions: {
          attempts: 5,
          timeout: 10000,
        },
        prefix: '@@user_',
      },
    } ,
    CLOUDINARY_QUEUE: {
      name: 'cloudinary',
      options: {
        defaultJobOptions: {
          attempts: 5,
          timeout: 10000,
        },
        prefix: '@@cloudinary_',
      },
    },
    FILE_REFERENCE_QUEUE: {
      name: 'fileReference',
      options: {
        defaultJobOptions: {
          attempts: 5,
          timeout: 10000,
        },
        prefix: '@@fileReference_',
      },
    } 
  },
  redisConfig: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    redisPrefix: process.env.REDIS_PREFIX
  },
  arenaConfig: {
    host: process.env.ARENA_HOST,
    port: process.env.ARENA_PORT,
    basePath: '/arena',
    disableListen: false,
  },
  REDIS_EXPIRE_TOKEN_KEY: 'BLACKLIST_TOKEN'
};
