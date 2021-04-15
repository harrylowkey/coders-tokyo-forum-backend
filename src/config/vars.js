require('dotenv').config();

module.exports = {
  mongoURL: process.env.MONGO_URL,
  redis_uri: process.env.REDIS_URL,
  port: process.env.PORT,
  socket_port: process.env.PORT_SOCKET,
  admin_port: process.env.ADMIN_PORT,
  jwtSecret: process.env.JWT_SECRET,
  prefix: process.env.PREFIX,
  ACCESS_TOKEN_EXPIRED_TIME: process.env.ACCESS_TOKEN_EXPIRED_TIME,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRECT,
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
    host: process.env.ARENA_HOST,
    port: process.env.ARENA_PORT,
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
