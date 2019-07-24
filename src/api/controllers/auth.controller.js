const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const bcrypt = require('bcrypt');
const Utils = require('../../utils');
const User = require('../models/user.model').model;

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

exports.sendEmailVerifyCode = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email }).lean();
    if (!user) throw Boom.notFound('Email is not registed');

    const verifyCode = {
      code: Math.floor(Math.random() * (99999 - 10000)) + 100000, // 5 characters
      expiresIn: new Date().getTime() + 120000,
    };
    await Promise.all([
      Utils.email.sendEmailVerifyCode(email, verifyCode),
      User.findOneAndUpdate(
        { email },
        {
          $set: { verifyCode },
        },
        { upsert: true },
      ),
    ]);
    return res.status(200).json({
      status: 200,
      message: 'Send email verify code successfully',
    });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  const { newPassword, confirmPassword, code } = req.body;
  try {
    if (newPassword !== confirmPassword) {
      throw Boom.badRequest(`Confirm password isn't matched`);
    }

    const user = await User.findOne({ 'verifyCode.code': code }).lean();
    if (!user) throw Boom.notFound('Wrong code or code expired time');

    if (user.verifyCode.code != code) throw Boom.badRequest('Wrong code');
    if (new Date().getTime() > user.verifyCode.expiresIn + 25200000 + 120000) {
      throw Boom.badRequest(' Code expired time');
    } // 25200000 = 7hours G+7_VN && 120000=2minues

    const hashPassword = bcrypt.hashSync(newPassword, 10);
    await User.findOneAndUpdate(
      { 'verifyCode.code': code },
      {
        $set: {
          password: hashPassword,
          verifyCode: {
            code: null,
            expiresIn: null,
          },
        },
      },
      { new: true },
    );

    return res
      .status(200)
      .json({ status: 200, message: 'Update password successfully' });
  } catch (error) {
    return next(error);
  }
};
