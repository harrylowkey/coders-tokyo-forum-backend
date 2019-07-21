const User = require('../models/user.model').model;
const httpStatus = require('http-status');
const Utils = require('../../utils');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: httpStatus.NOT_FOUND,
      message: 'User not found'
    })
  }

  const isMatchedPassword = Utils.bcrypt.comparePassword(user._id, password);
  if (!isMatchedPassword) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: httpStatus.BAD_REQUEST,
      message: 'Wrong password'
    })
  }

  const token = Utils.jwt.generateToken(user, 360000) // 1 hour
  user.password = undefined;
  user.__v = undefined
  res.cookie('access_token', token, {
    httpOnly: true,
  });

  return res.status(httpStatus.OK).json({
     status: httpStatus.OK,
     message: 'Login successfully',
     data: {
      ...user, 
      access_token: token
     }
    });
};

exports.register = async (req, res) => {
  const isExistingEmail = await User.findOne({ email: req.body.email });
  try {
    if (isExistingEmail) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ status: httpStatus.CONFLICT, message: 'Email already existed' });
    }
    const newUser = await User.create(req.body);
    newUser.password = undefined;
    newUser.__v = undefined;
    return res.status(httpStatus.OK).json({
      status: 200,
      message: 'Register successfully'
    });
  } catch (error) {
    return res
      .status(error.status)
      .json({ status: error.status, message: error.message });
  }
};

