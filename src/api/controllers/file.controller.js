const Boom = require('@hapi/boom');
const { File, Post } = require('@models');
const mongoose = require('mongoose');
const { FILE_REFERENCE_QUEUE } = require('@bull');
const { CloudinaryService } = require('@services');
const { videoConfig, audioConfig,
  blogCoverConfig, avatarConfig,
  foodPhotosConfig, photoConfig
} = require('@configVar');

//TODO: Cache getOne, getByID
exports.getFile = async (req, res, next) => {
  try {
    const file = await
      File.findOne({
        _id: req.params.fileId,
        user: req.user._id
      })
        .lean()
        .populate({
          path: 'userId',
          select: 'id username'
        });
    if (!file) {
      throw Boom.badRequest('Not found!');
    }

    return res.status(200).json({
      status: 200,
      data: file
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const file = await
      File.findOne({
        _id: req.params.fileId,
        user: req.user._id
      })
        .lean()

    if (!file) {
      throw Boom.badRequest('Not found file reference');
    }

    FILE_REFERENCE_QUEUE.deleteFile.add({ file });
    return res.status(200).json({
      status: 200,
      message: 'Delete success'
    });
  } catch (error) {
    return next(error);
  }
};

exports.uploadFile = async (req, res, next) => {
  try {
    const file = req.file;
    const type = req.query.type;
    let config;

    switch (type) {
      case 'avatar':
        config = avatarConfig;
        break;
      case 'video':
        config = videoConfig;
        break;
      case 'audio':
        config = audioConfig;
        break;
      case 'cover':
        config = blogCoverConfig;
        break;
      case 'food':
        config = foodPhotosConfig;
        break;
      case 'photo':
        config = photoConfig;
        break;
      default:
        throw Boom.badRequest('Invalid file type');
    }

    let resourceType = 'image';
    if (type === 'audio') {
      resourceType = 'audio';
    }

    const data = await CloudinaryService.uploadFileProcess(req.user, file, resourceType, type, config, null);
    return res.status(200).json({
      status: 200,
      data
    });
  } catch (error) {
    return next(error);
  }
};

exports.uploadMultipleFoodPhotos = async (req, res, next) => {
  try {
    const file = req.files[0];
    const data = await CloudinaryService.uploadFileProcess(req.user, file, 'image', '__foodPhotos__', foodPhotosConfig);
    if (!data) {
      throw Boom.badRequest('Upload failed');
    }
    return res.status(200).json({
      status: 200,
      data
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteMultipleFiles = async (req, res, next) => {
  const fileIds = req.body.fileIds;
  const files = await File.find({
    $and: [
      { _id: { $in: fileIds } },
      { user: req.user._id }
    ]
  });
  if (!files.length) {
    throw Boom.badRequest('Not found any files');
  }
  FILE_REFERENCE_QUEUE.deleteMultipleFiles.add({ files });
  return res.status(200).json({
    status: 200,
    message: 'Delete success'
  });
};

exports.updateImage = async (req, res, next) => {
  try {
    exports.uploadFile = async (req, res, next) => {
      try {
        const file = req.file;
        const type = req.query.type;
        const postId = req.body.postId;
        let config;

        switch (type) {
          case 'avatar':
            config = avatarConfig;
            break;
          case 'video':
            config = videoConfig;
            break;
          case 'audio':
            config = audioConfig;
            break;
          case 'blogCover':
            config = blogCoverConfig;
            break;
          default:
            throw Boom.badRequest('Invalid file type');
        }

        const data = await CloudinaryService.uploadFileProcess(req.user, file, 'image', type, config, postId);
        let updatedPost = await Post.findByIdAndUpdate(
          postId,
          { $set: { cover: data._id } },
          { new: true },
        );

        if (updatedPost) {
          const oldImage = await File.findById(postId).lean();
          FILE_REFERENCE_QUEUE.deleteFile.add({ oldImage });
        }
        return res.status(200).json({
          status: 200,
          data: updatedPost
        });
      } catch (error) {
        return next(error);
      }
    };
  } catch (error) {
    return next(error);
  }
};