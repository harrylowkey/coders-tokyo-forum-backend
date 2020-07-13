const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const { audioConfig } = require('@configVar');

const validatePOST = (req, res, next) => {
  const schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().min(1).max(16)).optional(),
    audio: Joi.object().required(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'artist',
        'composer',
      ).required(),
    }).required(),
    type: Joi.string().optional(),
    cover: Joi.object().required(),
  });

  const reqData = req.body;
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
    audio: Joi.object().optional(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'author',
        'artist',
        'composer',
        'actor',
        'director',
      ).required(),
    }).optional(),
    audioSize: Joi.number().max(audioConfig.chunk_size),
    type: Joi.string().optional(),
    cover: Joi.object().optional(),
  });

  const reqData = req.body;
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
