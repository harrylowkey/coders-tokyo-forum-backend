const User = require('../models/user.model').model;
const httpStatus = require('http-status');
const Utils = require('../../utils');
const Boom = require('@hapi/boom');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) throw Boom.notFound('User not found');

    const isMatchedPassword = Utils.bcrypt.comparePassword(
      password,
      user.password,
    );
    if (!isMatchedPassword) throw Boom.badRequest('Wrong password');

    const token = Utils.jwt.generateToken(user, 360000); // 1 hour
    user.password = undefined;
    user.__v = undefined;
    res.cookie('access_token', token, {
      httpOnly: true,
    });

    return res.status(httpStatus.OK).json({
      status: httpStatus.OK,
      message: 'Login successfully',
      data: {
        user,
        access_token: token,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.register = async (req, res, next) => {
  const isExistingEmail = await User.findOne({ email: req.body.email });
  try {
    if (isExistingEmail) throw Boom.badRequest('Email already existed');

    const newUser = await User.create(req.body);
    newUser.password = undefined;
    newUser.__v = undefined;
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Register successfully',
    });
  } catch (error) {
    return next(error);
  }
};
