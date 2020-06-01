const JWTUtils = require('@utils').jwt;
const Boom = require('@hapi/boom');
const { User } = require('@models');

exports.checkAccessToken = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization;
    if (!accessToken) {
      return next(Boom.unauthorized('Missing authorization token'));
    }

    accessToken = accessToken.replace('Bearer ', '');
    const decodedToken = await JWTUtils.verifyToken(accessToken);
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
