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
};
