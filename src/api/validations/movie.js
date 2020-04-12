const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')


let validatePOST = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().required()).optional(),
    coverImage: Joi.object().required(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'author',
        'singer',
        'composer',
        'actor',
        'actress',
        'director'
      ).required()
    }).required(),
    url: Joi.string().optional()
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
};