const jwt = require('jsonwebtoken');
const Redis = require('@redis')
const { jwt_secret, expired_time_token, REDIS_EXPIRE_TOKEN_KEY } = require('@configVar');

const generateToken = (user, option) => {
  option = option || {};
  let salt = option.salt || '';
  let ttl = option.ttl || 7200; // 1hour default
  let claims = {
    id: user._id,
    username: user.username,
    email: user.email,
  };
  return jwt.sign(claims, jwt_secret + salt, {
    expiresIn: ttl,
  });
};

const verifyToken = async (token, salt = '') => {
  let verify
  try {
    verify = jwt.verify(token, jwt_secret + salt);
  } catch (e) {
    console.log('Error when verify token')
    return null;
  }

  // Check token deactivate
  const userId = verify.id
  const iat = verify.iat
  const expireTokenKey = await Redis.makeKey([REDIS_EXPIRE_TOKEN_KEY, userId])

  const deactivateTime = await Redis.getCache({
    key: expireTokenKey,
    isJSON: false,
    isZip: false,
  })
  if (deactivateTime && iat < parseInt(deactivateTime)) {
    console.log('Token in blacklist:', iat, deactivateTime)
    return null
  } else {
    return verify
  }

};

module.exports = {
  generateToken: generateToken,
  verifyToken: verifyToken,
};
