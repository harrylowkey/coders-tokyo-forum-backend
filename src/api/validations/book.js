const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')


let validatePOST = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().required()).optional(),
    banner: Joi.object().required(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'author',
      ).required()
    }).required(),
    book: Joi.object().required()
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
    description: Joi.string().optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string().required()).optional(),
    banner: Joi.object().optional(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'author',
      ).required()
    }).optional(),
    book: Joi.object().optional()
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