const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')


let validatePOST = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().required()).optional(),
    coverImage: Joi.object().required()
  })

  let reqData = req.body;
  if (req.file) {
    reqData.coverImage = req.file
  }
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
    description: Joi.string().optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string().required()).optional(),
    coverImage: Joi.object().optional()
  })

  let reqData = req.body;
  if (req.file) {
    reqData.coverImage = req.file
  }
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