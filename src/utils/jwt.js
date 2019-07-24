const jwt = require('jsonwebtoken');
const { jwt_secret, expired_time_token } = require('../config/vars');


const generateToken = (user, option) => {
  option = option || {};
  let salt = option.salt || '';
  let ttl = option.ttl || (expired_time_token || 3600000); // 1h as default
  let claims = {
    id: user.id,
    email: user.email,
  };

  return jwt.sign(
    claims, 
    jwt_secret + salt, {
    expiresIn: ttl,
  });
}

const verifyToken = (token, salt = '') => {
  try {
    return jwt.verify(token, secretKey + salt);
  } catch (e) {
    return null;
  }
};

module.exports = {
  generateToken: generateToken,
  verifyToken: verifyToken,
};
