const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const Utils = require('@utils');
const User = require('@models').User;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { avatarConfig } = require('@configVar');

exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .lean()
      .select('-verifyCode -__v -password');

    if (!user) throw Boom.badRequest('Not found user')
    return res.status(200).json({
      status: 200,
      message: 'success',
      data: user,
    });
  } catch (error) {
    console.log(error)
    return next(error)
  }
};

exports.updateProfile = async (req, res, next) => {
  const { username, hobbies, socialLinks, sex, age, job } = req.body;
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      throw Boom.badRequest('Not found user');
    }
    const query = {};
    if (username) query.username = username;
    if (sex) query.sex = sex;
    if (age) query.age = age;
    if (job) query.job = job;
    if (hobbies) query.hobbies = hobbies;
    if (socialLinks) query.socialLinks = socialLinks;

    const result = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: query },
      { new: true },
    )
      .lean()
      .select('-__v -password -verifyCode');

    if (!result) {
      throw Boom.badRequest('Update profile failed')
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

/**
 * fileUploaded: {
    fieldname: 'path',
    originalname: '91427262_222687395745934_4371644556861505536_n.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    public_id: 'Coders-Tokyo-Forum/avatars/91427262_222687395745934_4371644556861505536_n.jpg',
    version: 1586543868,
    signature: 'ffe465d9b65cfa529181d151f993ef7da252a35e',
    width: 200,
    height: 200,
    format: 'jpg',
    resource_type: 'image',
    created_at: '2020-04-10T16:34:56Z',
    tags: [],
    bytes: 13393,
    type: 'upload',
    etag: 'af01f94be1071e1ee1a54bccc48cd84e',
    placeholder: false,
    url: 'http://res.cloudinary.com/hongquangraem/image/upload/v1586543868/Coders-Tokyo-Forum/avatars/91427262_222687395745934_4371644556861505536_n.jpg.jpg',
    secure_url: 'https://res.cloudinary.com/hongquangraem/image/upload/v1586543868/Coders-Tokyo-Forum/avatars/91427262_222687395745934_4371644556861505536_n.jpg.jpg',
    overwritten: true,
    original_filename: 'file'
  }
}
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .lean()
      .populate({
        path: 'avatar'
      })
    if (!user) {
      throw Boom.badRequest('Not found user')
    }
    const newAvatar = req.file;
    const avatar = await CloudinaryService.updateAvatarProcess(user, newAvatar);

    const updatedAvatar = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: { avatar },
      },
      { new: true },
    )
    if (!updatedAvatar) {
      throw Boom.badRequest('Upload avatar failed');
    }

    return res.status(httpStatus.OK).json({
      status: httpStatus.OK,
      message: 'Update avatar success',
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) {
      throw Boom.badRequest('Not found user')
    }
    const avatarId = user.avatar.public_id;
    if (!avatarId) {
      throw Boom.badRequest('Not exist avatar to delete')
    }
    const isDeleted = await Promise.props({
      onCloudinary: cloudinary.uploader.destroy(avatarId),
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

exports.getByUsername = async(req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean()
    if (!user) throw Boom.badRequest('Not found user')
    return res.status(200).json({
      status: 200,
      data: user
    })
  } catch (error) {
    console.log(error)
    return next(error)
  }
}
