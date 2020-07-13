const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const { videoConfig } = require('@configVar');

const validatePOST = (req, res, next) => {
  const schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().min(1).max(16)).optional(),
    isUpload: Joi.boolean().required(),
    url: Joi.string().when('isUpload', {
      is: false,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    video: Joi.object().when('isUpload', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    videoSize: Joi.number().max(videoConfig.chunk_size),
  });

  const reqData = req.body;
  reqData.isUpload = req.query.isUpload;
  if (req.file) {
    reqData.video = req.file;
    reqData.videoSize = req.file.size;
  }
  const { error } = schema.validate(reqData);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

const validatePUT = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    throw Boom.badRequest('Atleast 1 field required');
  }
  const schema = Joi.object().keys({
    topic: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string().min(1).max(16)).optional(),
    isUpload: Joi.boolean().optional(),
    url: Joi.string().optional(),
    video: Joi.object().optional(),
    videoSize: Joi.number().max(videoConfig.chunk_size),
  });

  const reqData = req.body;
  reqData.isUpload = req.query.isUpload;
  if (req.file) {
    reqData.video = req.file;
    reqData.videoSize = req.file.size;
  }
  const { error } = schema.validate(reqData);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

module.exports = {
  validatePOST,
  validatePUT,
};
