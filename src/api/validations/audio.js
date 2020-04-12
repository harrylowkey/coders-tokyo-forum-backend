const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')
const { audioConfig} = require('@configVar')

let validatePOST = (req, res, next) => {
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().required()).optional(),
    audio: Joi.object().required(),
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
    audioSize: Joi.number().max(audioConfig.chunk_size)
  })
  
  let reqData = req.body;
  if (req.file) {
    reqData.audio = req.file,
    reqData.audioSize= req.file.size
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