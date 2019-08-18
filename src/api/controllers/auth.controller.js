const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const bcrypt = require('bcrypt');
const Utils = require('../../utils');
const User = require('../models/').User;
const Promise = require('bluebird');

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email })
      .lean()
      .select('-__v -verifyCode -posts -likedPosts -savedPosts');
    if (!user) throw Boom.notFound('User not found');

    const isMatchedPassword = Utils.bcrypt.comparePassword(
      password,
      user.password,
    );
    if (!isMatchedPassword) throw Boom.badRequest('Wrong password');

    const token = Utils.jwt.generateToken(user);
    user.password = undefined;
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
    if (isExistingEmail) throw Boom.conflict('Email already existed');

    try {
      const [newUser] = await Promise.all([
        User.create(req.body),
        Utils.email.sendEmailWelcome(req.body.email, req.body.username),
      ]);
      newUser.password = undefined;
      newUser.__v = undefined;

      return res.status(httpStatus.OK).json({
        status: 200,
        message: 'Register successfully',
      });
    } catch (error) {
      return res.status(400).json({
        status: 400,
        message: 'Register failed',
      });
    }
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

    try {
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
      return res.status(400).json({
        status: 400,
        message: 'Send email verify code failed',
      });
    }
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
    if (!user) throw Boom.notFound('Wrong code');
    const isExpired = Date.now() > user.verifyCode.expiresIn;
    if (isExpired) throw Boom.badRequest('Code expired time');

    if (user.verifyCode.code != code) throw Boom.badRequest('Code not matched');
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

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = req.user;
    const isMatchedOldPass = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatchedOldPass) {
      throw Boom.badRequest('Wrong old password, change password failed');
    }

    if (newPassword !== confirmPassword) {
      throw Boom.badRequest('Confirm password wrong');
    }
    const hashPassword = bcrypt.hashSync(newPassword, 10);
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          password: hashPassword,
        },
      },
      { new: true },
    );
    return res
      .status(200)
      .json({ status: 200, message: 'Change password successfully' });
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('access_token');
  return res
    .status(httpStatus.OK)
    .json({ status: httpStatus.OK, message: 'Logout successfully' });
};
