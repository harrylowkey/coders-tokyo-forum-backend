const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')
const { audioConfig} = require('@configVar')

let validatePOST = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    audio: Joi.object().required(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'artist',
        'composer',
      ).required()
    }).required(),
    type: Joi.string().optional(),
    cover: Joi.object().required()
  })
  
  let reqData = req.body;
  const { error } = schema.validate(reqData)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()

}

let validatePUT = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    throw Boom.badRequest('Atleast 1 field required')
  }
  let schema = Joi.object().keys({
    topic: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    audio: Joi.object().optional(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'author',
        'artist',
        'composer',
        'actor',
        'director'
      ).required()
    }).optional(),
    audioSize: Joi.number().max(audioConfig.chunk_size),
    type: Joi.string().optional()
  })
  
  let reqData = req.body;
  const { error } = schema.validate(reqData)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()

}

module.exports = {
  validatePOST,
  validatePUT
};