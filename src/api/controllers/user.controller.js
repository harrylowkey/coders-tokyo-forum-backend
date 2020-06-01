const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const { User } = require('@models');
const { CloudinaryService } = require('@services');
const { CLOUDINARY_QUEUE, FILE_REFERENCE_QUEUE } = require('@bull');

exports.getById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .lean()
      .select('-verifyCode -__v -password')
      .populate({
        path: 'avatar',
        select: '-__v -user',
      });

    if (!user) throw Boom.badRequest('Not found user');
    return res.status(200).json({
      status: 200,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    })
      .lean()
      .select('-verifyCode -__v -password')
      .populate({
        path: 'avatar',
        select: '-__v -user',
      });

    if (!user) throw Boom.badRequest('Not found user');
    return res.status(200).json({
      status: 200,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  const {
    hobbies, socialLinks, sex, age, job, description,
  } = req.body;
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      throw Boom.notFound('Not found user to update');
    }
    const data = {};
    if (sex) data.sex = sex;
    if (age) data.age = age;
    if (job) data.job = job;
    if (hobbies) data.hobbies = hobbies;
    if (socialLinks) data.socialLinks = socialLinks;
    if (description) data.description = description;
    const result = await User.findByIdAndUpdate(
      req.user._id,
      { $set: data },
      { new: true },
    )
      .lean()
      .select('-__v -password -verifyCode');

    if (!result) {
      throw Boom.badRequest('Update profile failed');
    }

    return res.status(200).json({
      status: 200,
      message: 'Update profile successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
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
    const { avatar } = req.body;
    const user = await User.findById(req.user._id)
      .lean()
      .populate({
        path: 'avatar',
      });
    if (!user) {
      throw Boom.badRequest('Not found user');
    }

    if (user.avatar.publicId) {
      CLOUDINARY_QUEUE.deleteAsset.add({ publicId: user.avatar.publicId });
    }

    const updatedAvatar = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { avatar },
      },
      { new: true },
    );

    if (!updatedAvatar) {
      throw Boom.badRequest('Upload avatar failed');
    }

    return res.status(httpStatus.OK).json({
      status: httpStatus.OK,
      message: 'Update avatar success',
      data: {
        publicId: avatar.publicId,
        secureURL: avatar.secureURL,
        fileName: avatar.fileName,
        sizes: avatar.sizeBytes,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .lean()
      .populate({
        path: 'avatar',
      });
    if (!user) {
      throw Boom.badRequest('Not found user');
    }
    const { avatar } = user;
    if (!avatar) {
      throw Boom.badRequest('Deleted avatar failed, not found avatar');
    }

    CLOUDINARY_QUEUE.deleteAsset.add({ publicId: avatar.publicId });
    FILE_REFERENCE_QUEUE.deleteFile.add({ avatar });

    const deletedAva = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { avatar: null },
      },
      { new: true },
    );

    if (!deletedAva) {
      throw Boom.badRequest('Deleted avatar failed');
    }

    return res.status(200).json({
      status: 200,
      message: 'Delete avatar successfully',
    });
  } catch (error) {
    return next(error);
  }
};

exports.getByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .lean()
      .populate({
        path: 'avatar',
        select: '-__v -user',
      });
    if (!user) throw Boom.badRequest('Not found user');
    return res.status(200).json({
      status: 200,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};


exports.follow = async (req, res, next) => {
  try {
    const { user } = req;
    const userToFollow = await User.findById(req.params.userId).lean();
    if (!userToFollow) {
      throw Boom.badRequest('Not found user to follow');
    }

    if (user._id.toString() === userToFollow._id.toString()) {
      throw Boom.badRequest('Can not follow yourself');
    }

    const [updateFollwing, updateFollowers] = await Promise.all([
      User.findByIdAndUpdate(user._id,
        {
          $addToSet: { following: userToFollow },
        },
        { new: true }),
      User.findByIdAndUpdate(userToFollow._id,
        {
          $addToSet: { followers: user },
        },
        { new: true }),
    ]);

    if (!updateFollowers || !updateFollwing) {
      throw Boom.badRequest('Follow failed');
    }

    return res.status(200).json({
      status: 200,
      message: 'Follow success',
    });
  } catch (error) {
    return next(error);
  }
};

exports.unfollow = async (req, res, next) => {
  try {
    const { user } = req;
    const userToUnfollow = await User.findById(req.params.userId).lean();
    if (!userToUnfollow) {
      throw Boom.badRequest('Not found user to unfollow');
    }

    if (user._id.toString() === userToUnfollow._id.toString()) {
      throw Boom.badRequest('Can not unfollow yourself');
    }

    const [updateFollwing, updateFollowers] = await Promise.all([
      User.findByIdAndUpdate(user._id,
        {
          $pull: { following: userToUnfollow._id },
        },
        { new: true }),
      User.findByIdAndUpdate(userToUnfollow._id,
        {
          $pull: { followers: user._id },
        },
        { new: true }),
    ]);

    if (!updateFollowers || !updateFollwing) {
      throw Boom.badRequest('Follow failed');
    }

    return res.status(200).json({
      status: 200,
      message: 'Unfollow success',
    });
  } catch (error) {
    return next(error);
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .lean()
      .populate({
        path: 'followers',
        select: '_id username avatar',
        populate: {
          path: 'avatar',
          select: '_id secureURL',
        },
      });

    return res.status(200).json({
      status: 200,
      data: user.followers,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .lean()
      .populate({
        path: 'following',
        select: '_id username avatar',
        populate: {
          path: 'avatar',
          select: '_id secureURL',
        },
      });

    return res.status(200).json({
      status: 200,
      data: user.following,
    });
  } catch (error) {
    return next(error);
  }
};
