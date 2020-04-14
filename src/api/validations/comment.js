const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')

let commentValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    content: Joi.string().not('').required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()
}


let updateCommentValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    content: Joi.string().not('').required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()
}

module.exports = {
  commentValidate,
  updateCommentValidate
};