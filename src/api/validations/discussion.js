const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')
const { audioConfig} = require('@configVar')

let validatePOST = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().required()).optional(),
  })
  
  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()
}

let validatePUT = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string().required()).optional(),
  })
  
  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()
}

module.exports = {
  validatePOST,
  validatePUT
};