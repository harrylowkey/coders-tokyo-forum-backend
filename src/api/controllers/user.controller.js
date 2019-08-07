const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const Utils = require('../../utils');
const User = require('../models/').User;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { avatarConfig } = require('../../config/vars');

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
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      throw Boom.notFound('Not found user to update');
    }
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
    )
      .lean()
      .select('-__v -password -verifyCode');

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
  } catch (error) {
    return next(error)   
  }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      throw Boom.badRequest('Not found user to upload avatar')
    }
    const newAvatar = req.file.path;
    const avatar = req.user.avatar || {};
    const oldAvatarId = avatar.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

    const data = { oldImageId: oldAvatarId, newImage: newAvatar };
    const uploadedAvatar = await Utils.cloudinary.deleteOldImageAndUploadNewImage(
      data,
      avatarConfig,
    );

    if (!uploadedAvatar) {
      throw Boom.badRequest('Upload avatar failed');
    }

    const updatedAvatar = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          'avatar.public_id': uploadedAvatar.public_id,
          'avatar.url': uploadedAvatar.url,
          'avatar.secure_url': uploadedAvatar.secure_url
        },
      },
      { new: true },
    )
      .lean()
      .select('-_id avatar');
    if (!updatedAvatar) {
      throw Boom.badRequest('Upload avatar failed');
    }

    return res.status(httpStatus.OK).json({
      status: httpStatus.OK,
      message: 'success',
      data: updatedAvatar.avatar,
    });
  } catch (error) {
    
    return next(error);
  }
};

exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      throw Boom.badRequest('Not found user to delete avatar')
    }
    const isDeleted = await Promise.props({
      onCloudinary: cloudinary.uploader.destroy(req.params.avatarId),
      onDatabase: User.findByIdAndUpdate(
        req.params.userId,
        {
          $set: { 'avatar.public_id': null, 'avatar.url': null },
        },
        { new: true },
      ),
    });

    if (isDeleted.onCloudinary.result !== 'ok' || !isDeleted.onDatabase) {
      throw Boom.badRequest('Delete avatar failed');
    }

    return res.status(200).json({
      status: 200,
      message: 'Delete avatar successfully',
    });
  } catch (error) {
    return next(error);
  }
};
