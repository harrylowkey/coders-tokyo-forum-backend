const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const bcrypt = require('bcrypt');
const Utils = require('../../utils');
const User = require('../models/user.model').model;
const Promise = require('bluebird');

exports.getOneUser = async (req, res) => {
  const user = await User.findById(req.params.userId)
    .lean()
    .select('-verifyCode -__v -password');
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: httpStatus.NOT_FOUND,
      message: 'Not found user profile',
    });
  }
  return res.status(200).json({
    status: 200,
    message: 'success',
    data: user,
  });
};
