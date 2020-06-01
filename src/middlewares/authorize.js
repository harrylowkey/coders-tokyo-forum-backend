const JWTUtils = require('@utils').jwt;
const Boom = require('@hapi/boom');
const { User } = require('@models');

exports.checkAccessToken = async (req, res, next) => {
  try {
    let access_token = req.headers.authorization;
    if (!access_token) {
      return next(Boom.unauthorized('Missing authorization token'));
    }

    access_token = access_token.replace('Bearer ', '');
    const decodedToken = await JWTUtils.verifyToken(access_token);
    if (!decodedToken) throw Boom.unauthorized('Invalid token or token expired time');

    const user = await User.findById(decodedToken.id);
    if (!user) {
      throw Boom.unauthorized('User haven\'t registed account yet');
    }

    req.user = {
      _id: user._id,
      username: user.username,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};
