const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')

let createPostValidate = (req, res, next) => {
  console.log(req)
  let schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.string().required(),
    type: Joi.string().valid(
      'song',
      'blog',
      'book',
      'food',
      'movie',
      'video',
      'podcast',
      'discussion'
    ).required(),
    tags: Joi.array().items(Joi.string().required()).optional(),
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
    }).when('type', {
      is: Joi.valid('song', 'book', 'movie', 'podcast'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    coverImage: Joi.string().when('type', {
      is: Joi.valid('food', 'movie', 'book', 'blog'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    url: Joi.string().optional(),
    video: Joi.string().when('url', {
      is: Joi.equal(null),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    audio: Joi.string().when('type', {
      is: Joi.valid('song', 'podcast'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

    audio: Joi.string().when('type', {
      is: Joi.valid('song', 'podcast'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    food: Joi.object().keys({
      foodName: Joi.string().required(),
      url: Joi.string().optional(),
      price: Joi.string().required(),
      location: Joi.string().optional(),
      star: Joi.number().optional()
    }).when('type', {
      is: Joi.equal('food'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    foodPhotos: Joi.array().when('type', {
      is: Joi.equal('food'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })

  let reqData = req.body;
  reqData.type = req.query.type

  const { error } = schema.validate(reqData)
  if (error) {
    throw Boom.badRequest(error.message)
  }

  return next()
}

module.exports = {
  createPostValidate,
};