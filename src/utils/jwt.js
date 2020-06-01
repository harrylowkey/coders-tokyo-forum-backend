const jwt = require('jsonwebtoken');
const Redis = require('@redis');
const { jwt_secret, expired_time_token, REDIS_EXPIRE_TOKEN_KEY } = require('@configVar');

const generateToken = (user, option) => {
  option = option || {};
  const salt = option.salt || '';
  const ttl = option.ttl || 7200; // 2hour default
  const claims = {
    id: user._id,
    username: user.username,
    email: user.email,
  };
  return jwt.sign(claims, jwt_secret + salt, {
    expiresIn: ttl,
  });
};

const verifyToken = async (token, salt = '') => {
  let verify;
  try {
    verify = jwt.verify(token, jwt_secret + salt);
  } catch (e) {
    console.log('Error when verify token');
    return null;
  }

  // Check token deactivate
  const userId = verify.id;
  const { iat } = verify;
  const expireTokenKey = await Redis.makeKey([REDIS_EXPIRE_TOKEN_KEY, userId]);

  const deactivateTime = await Redis.getCache({
    key: expireTokenKey,
    isJSON: false,
    isZip: false,
  });
  if (deactivateTime && iat < parseInt(deactivateTime)) {
    console.log('Token in blacklist:', iat, deactivateTime);
    return null;
  }
  return verify;
};

module.exports = {
  generateToken,
  verifyToken,
};
