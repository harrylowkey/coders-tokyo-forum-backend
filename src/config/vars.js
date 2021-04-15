require('dotenv').config();

module.exports = {
  mongoURL: 'mongodb://54.151.207.118:27017/coders-tokyo-forum',
  redis_uri: 'redis://54.151.207.118:6379/0',
  port: 3000,
  socket_port: 8888,
  admin_port: 3001,
  jwtSecret: 'abc@1234124',
  prefix: 'CT-forum-v1',
  ACCESS_TOKEN_EXPIRED_TIME: '86400',
  cloudinary_name: 'hongquangraem',
  cloudinary_api_key: '161826183277477',
  cloudinary_api_secret: '-qDKS9DELIChHPEKl8b3Ft8imNU',
  videoConfig: {
    folder: 'Coders-Tokyo-Forum/posts/media',
    use_filename: true,
    unique_filename: true,
    resource_type: 'video',
    chunk_size: 15000000, // 15mb,
    // async: true,
  },
  audioConfig: {
    folder: 'Coders-Tokyo-Forum/posts/media',
    use_filename: true,
    unique_filename: true,
    resource_type: 'video',
    chunk_size: 20000000, // 10mb
    // async: true,
  },
  blogCoverConfig: {
    folder: 'Coders-Tokyo-Forum/posts',
    use_filename: false,
    unique_filename: true,
    resource_type: 'image',
    allowedFormats: ['jpg', 'png', 'jpeg'],
    chunk_size: 6000000, // 6mb
  },
  avatarConfig: {
    folder: 'Coders-Tokyo-Forum/avatars',
    use_filename: false,
    unique_filename: true,
    resource_type: 'image',
    allowedFormats: ['jpg', 'png', 'jpeg'],
    chunk_size: 6000000, // 6mb
    // async: true,
    transformation: [
      {
        width: 400,
        height: 400,
      },
    ],
  },
  foodPhotosConfig: {
    folder: 'Coders-Tokyo-Forum/posts/foodReview',
    use_filename: false,
    unique_filename: true,
    resource_type: 'image',
    allowedFormats: ['jpg', 'png', 'jpeg'],
    chunk_size: 6000000, // 6mb,
    maxPhotos: 10,
    // async: true,
    transformation: [
      {
        width: 960,
        height: 960,
      },
    ],
  },
  photoConfig: {
    folder: 'Coders-Tokyo-Forum/posts',
    use_filename: false,
    unique_filename: true,
    resource_type: 'image',
    allowedFormats: ['jpg', 'png', 'jpeg'],
    chunk_size: 6000000, // 6mb,
    maxPhotos: 10,
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
        redis: { 
          port: 6379, 
          host: process.env.REDIS_HOST, 
        }
      },
    },
    USER_QUEUE: {
      name: 'user',
      options: {
        defaultJobOptions: {
          attempts: 5,
          timeout: 10000,
        },
        prefix: '@@user_',
        redis: { 
          port: 6379, 
          host: process.env.REDIS_HOST, 
        }
      },
    },
    CLOUDINARY_QUEUE: {
      name: 'cloudinary',
      options: {
        defaultJobOptions: {
          attempts: 5,
          timeout: 10000,
        },
        prefix: '@@cloudinary_',
        redis: { 
          port: 6379, 
          host: process.env.REDIS_HOST, 
        }
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
        redis: { 
          port: 6379, 
          host: process.env.REDIS_HOST, 
        }
      },
    },
  },
  arenaConfig: {
    host: '54.151.207.118',
    port: '3001',
    basePath: '/arena',
    disableListen: false,
  },
  REDIS_EXPIRE_TOKEN_KEY: 'BLACKLIST_TOKEN',
  DEFAULT_AVATAR_BOY_1: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965814/default_avatar_boy.png',
  DEFAULT_AVATAR_BOY_2: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965840/default_avatar_boy_2.png',
  DEFAULT_AVATAR_BOY_3: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965728/default_avatar_boy_3.png',
  DEFAULT_AVATAR_BOY_4: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965772/default_avatar_boy_4.png',
  DEFAULT_AVATAR_BOY_5: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965573/default_avatar_boy_5.png',
  DEFAULT_AVATAR_BOY_6: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965559/default_avatar_boy_6.png',
  DEFAULT_AVATAR_BOY_7: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965495/default_avatar_boy_7.png',
  DEFAULT_AVATAR_GIRL_1: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965680/default_avatar_girl.png',
  DEFAULT_AVATAR_GIRL_2: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965714/default_avatar_girl_2.png',
  DEFAULT_AVATAR_GIRL_3: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965791/default_avatar_girl_3.png',
  DEFAULT_AVATAR_GIRL_4: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965754/default_avatar_girl_4.png',
  DEFAULT_AVATAR_UNKNOWN_1: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965648/default_avatar_unknow_1.png',
  DEFAULT_AVATAR_UNKNOWN_2: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586965594/default_avatar_unknown_2.png',
  SOCKET_USER_CONNECTIONS: 'USER_CONNECTIONS',
  SOCKET_ONLINE_MEMBERS: 'ONLINE_MEMBERS',
  SOCKET_NEW_COMMENT: 'NEW_COMMENT',
  SOCKET_DELETE_COMMENT: 'DELETE_COMMENT',
  SOCKET_EDIT_COMMENT: 'EDIT_COMMENT',
  SOCKET_NOTIFICATION: 'NOTIFICATIONS',
};
