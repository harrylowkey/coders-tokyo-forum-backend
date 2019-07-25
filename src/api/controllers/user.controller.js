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

exports.updateProfile = async (req, res, next) => {
  const { username, hobbies, links, sex, age, job } = req.body;

  const query = {};
  if (username) query.username = username;
  if (sex) query.sex = sex;
  if (age) query.age = age;
  if (job) query.job = job;
  if (hobbies) query.hobbies = hobbies;
  if (links) query.links = links;

  const result = await User.findByIdAndUpdate(
    req.params.userId,
    { $set: query },
    { new: true },
  ).lean().select('-__v -password -verifyCode');

  if (!result) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: httpStatus.BAD_REQUEST,
      message: 'Update profile failed',
    });
  }

  return res.status(200).json({
    status: 200,
    message: 'Update profile successfully',
    data: result,
  });
};
