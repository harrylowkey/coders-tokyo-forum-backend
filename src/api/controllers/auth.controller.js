const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const bcrypt = require('bcrypt');
const Utils = require('@utils');
const { User, File } = require('@models');
const Redis = require('@redis');
const { REDIS_EXPIRE_TOKEN_KEY } = require('@configVar');
const { EMAIL_QUEUE } = require('@bull');
const configVar = require('@configVar');


exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email })
      .lean()
      .populate({
        path: 'avatar',
        select: 'publicId secureURL fileName sizeBytes',
      })
      .select('-__v -verifyCode -posts -likedPosts -savedPosts');
    if (!user) throw Boom.badRequest('Not found user');

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
  try {
    const isExistingEmail = await User.findOne({ email: req.body.email });
    if (isExistingEmail) throw Boom.conflict('Email already existed');

    if (req.body.username.length > 20) {
      throw Boom.badRequest('Username should be less than 20 characters');
    }

    if (req.body.username.indexOf(' ') >= 0) {
      throw Boom.badRequest('Username should not have blank space');
    }
    const isExistingUsername = await User.findOne({ username: req.body.username });
    if (isExistingUsername) {
      throw Boom.conflict('Username is existed');
    }

    const redisKey = await Redis.makeKey(['EMAIL_VERIFY_CODE', req.body.email]);
    const redisCode = await Redis.getCache({
      key: redisKey,
    });

    if (!redisCode ||  parseInt(redisCode) !== req.body.code) {
      throw Boom.badRequest('Invalid or expired code');
    }

    if (req.body.confirmPassword !== req.body.password) {
      throw Boom.badRequest('Confirm password is not matched');
    }

    await Utils.validator.validatePassword(req.body.password);

    const userIntance = await new User(req.body);

    const sex = req.body.sex || 'Unknown';
    userIntance.avatar = await genDefaultAvatar(sex, userIntance._id);

    const newUser = await userIntance.save();

    if (!newUser) throw Boom.badRequest('Sign up failed');
    newUser.password = undefined;
    newUser.__v = undefined;

    // let mailData = {
    //   to: req.body.email,
    //   name: req.body.username,
    // };
    // EMAIL_QUEUE.sendWelcomeEmail.add(mailData);
    // MailerService.sendEmail(mailData, 'SIGN_UP');

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
    const redisKey = await Redis.makeKey(['EMAIL_VERIFY_CODE', email]);
    const emailCode = await Redis.getCache({
      key: redisKey,
    });

    if (emailCode) throw Boom.badRequest('Please wait 5 minutes!');

    const verifyCode = Math.floor(Math.random() * (99999 - 10000)) + 100000;
    await Redis.setCache({
      key: redisKey,
      value: verifyCode,
      isJSON: false,
      isZip: false,
      ttl: 5 * 60,
    });

    const mailData = {
      to: email,
      verifyCode,
    };

    EMAIL_QUEUE.sendEmailCode.add(mailData);
    return res.status(200).json({
      status: 200,
      message: 'Send email verify code successfully',
    });
  } catch (error) {
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  let {
    newPassword, confirmPassword, code, email,
  } = req.body;
  try {
    email = email.trim().toLowerCase();
    const user = await User.findOne({ email }).lean();

    if (!user) {
      throw Boom.badRequest('Not found email');
    }

    const redisKey = await Redis.makeKey(['EMAIL_VERIFY_CODE', req.body.email]);
    const redisCode = await Redis.getCache({
      key: redisKey,
    });

    if (!redisCode ||  parseInt(redisCode) !== code) {
      throw Boom.badRequest('Invalid or expired code');
    }

    if (newPassword !== confirmPassword) {
      throw Boom.badRequest('Confirm password isn\'t matched');
    }

    Utils.validator.validatePassword(newPassword);

    const hashPassword = bcrypt.hashSync(newPassword, 10);
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: { password: hashPassword },
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
    const {
      oldPassword, newPassword, confirmPassword, email, code,
    } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId).lean();

    const isMatchedOldPass = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatchedOldPass) {
      throw Boom.badRequest('Old password is wrong');
    }

    const redisKey = await Redis.makeKey(['EMAIL_VERIFY_CODE', email]);
    const redisCode = await Redis.getCache({
      key: redisKey,
    });
    if (!redisCode || parseInt(redisCode) !== code) {
      throw Boom.badRequest('Invalid or expired code');
    }

    if (newPassword !== confirmPassword) {
      throw Boom.badRequest('Confirm password is wrong');
    }

    Utils.validator.validatePassword(newPassword);

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

    const expireTokenKey = await Redis.makeKey([REDIS_EXPIRE_TOKEN_KEY, user._id]);
    await Redis.setCache({
      key: expireTokenKey,
      value: Math.floor(Date.now() / 1000),
      isJSON: false,
      isZip: false,
    });

    return res
      .status(200)
      .json({ status: 200, message: 'Change password successfully' });
  } catch (error) {
    return next(error);
  }
};

const genDefaultAvatar = async (sex, userId) => {
  let min;
  let max;
  switch (sex) {
    case 'Unknown':
      min = 1;
      max = 2;
      break;
    case 'Male':
      min = 1;
      max = 7;
      break;
    case 'Female':
      min = 1;
      max = 4;
      break;
    default:
      break;
  }
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  let secureURL = '';
  if (sex === 'Unknown') {
    secureURL = configVar[`DEFAULT_AVATAR_UNKNOWN_${randomNumber}`];
  }

  if (sex === 'Male') {
    secureURL = configVar[`DEFAULT_AVATAR_BOY_${randomNumber}`];
  }

  if (sex === 'Female') {
    secureURL = configVar[`DEFAULT_AVATAR_GIRL_${randomNumber}`];
  }

  const avatar = await new File({
    secureURL,
    user: userId,
  }).save();

  return avatar;
};
