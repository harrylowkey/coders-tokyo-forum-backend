const Boom = require('@hapi/boom');
const { File } = require('@models');
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
    // const 
  } catch (error) {
    return next(error)
  }
}