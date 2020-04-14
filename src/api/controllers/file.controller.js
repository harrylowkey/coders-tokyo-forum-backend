const Boom = require('@hapi/boom');
const { File } = require('@models');
const mongoose = require('mongoose')
const { FILE_REFERENCE_QUEUE } = require('@bull');
const { CloudinaryService } = require('@services')
const { videoConfig, audioConfig, 
        blogCoverConfig, avatarConfig, 
        foodPhotosConfig 
      } = require('@configVar');

//TODO: Cache getOne, getByID
exports.getFile = async (req, res, next) => {
  try {
    const file = await
      File.findOne({
        _id: req.params.fileId,
        userId: req.user._id
      })
        .lean()
        .populate({
          path: 'userId',
          select: 'id username'
        })
    if (!file) {
      throw Boom.badRequest('Not found!')
    }

    return res.status(200).json({
      status: 200,
      data: file
    })
  } catch (error) {
    return next(error)
  }
}

exports.deleteFile = async (req, res, next) => {
  try {
    const file = await
      File.findOne({
        _id: req.params.fileId,
        userId: req.user._id
      }).lean()

    if (!file) {
      throw Boom.badRequest('Not found file reference')
    }

    FILE_REFERENCE_QUEUE.deleteFile.add({ file })
    return res.status(200).json({
      status: 200,
      message: 'Delete success'
    })
  } catch (error) {
    return next(error)
  }
}

exports.uploadFile = async (req, res, next) => {
  try {
    const file = req.file
    const type = req.query.type
    let config

    switch (type) {
      case 'avatar':
        config = avatarConfig
        break
      case 'video':
        config = videoConfig
        break
      case 'audio':
        config = audioConfig
        break
      case 'blogCover':
        config = blogCoverConfig
        break
      case 'food':
        config = foodPhotosConfig
        break
      default:
        throw Boom.badRequest('Invalid file type')
    }

    const data = await CloudinaryService.uploadAndRenameFile(req.user, file, 'image', type, config)
    return res.status(200).json({
      status: 200,
      data
    })
  } catch (error) {
    return next(error)
  }
}

exports.uploadMultipleFoodPhotos = async (req, res, next) => {
  try {
    const files = req.files;
    const data = await CloudinaryService.uploadMultipleFiles(req.user, files, '__foodPhotos__', foodPhotosConfig)
    return res.status(200).json({
      status: 200,
      data
    })
  } catch (error) {
    return next(error)
  }
}

exports.deleteMultipleFiles = async (req, res, next) => {
  const fileIds = req.body.fileIds
  const files = await File.find({
    $and: [ 
      { _id: { $in: fileIds } }, 
      { userId: req.user._id }
    ]
  })
  if (!files.length) {
    throw Boom.badRequest('Not found any files')
  }
  FILE_REFERENCE_QUEUE.deleteMultipleFiles.add({ files })
  return res.status(200).json({
    status: 200,
    message: 'Delete success'
  })
}