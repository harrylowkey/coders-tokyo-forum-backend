const Boom = require('@hapi/boom');
const { File } = require('@models');
const { FILE_REFERENCE_QUEUE } = require('@bull')

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