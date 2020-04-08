const jwt = require('jsonwebtoken');
const { jwt_secret, expired_time_token } = require('@configVar');

const generateToken = (user, option) => {
  option = option || {};
  let salt = option.salt || '';
  let ttl = option.ttl || 3600; // 1hour default
  let claims = {
    id: user._id,
    email: user.email,
  };
  return jwt.sign(claims, jwt_secret + salt, {
    expiresIn: ttl,
  });
};

const verifyToken = (token, salt = '') => {
  try {
    return jwt.verify(token, jwt_secret + salt);
  } catch (e) {
    return null;
  }
};

module.exports = {
  generateToken: generateToken,
  verifyToken: verifyToken,
};
