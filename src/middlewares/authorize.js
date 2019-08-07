const Utils = require('../utils/jwt');
const Boom = require('@hapi/boom');
const User = require('../api/models/user.model').model;

exports.checkAccessToken = async (req, res, next) => {
  try {
    const access_token = req.cookies.access_token;
    const decodedToken = Utils.verifyToken(access_token);
    if (!decodedToken)
      throw Boom.unauthorized('Invalid token or token expired time');

    const user = await User.findById(decodedToken.id);
    if (!user) {
      throw Boom.unauthorized(`User haven't registed account yet`);
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
