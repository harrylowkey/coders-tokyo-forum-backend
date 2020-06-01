const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');


const createPostValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().required(),
    type: Joi.string().valid(
      'song',
      'blog',
      'book',
      'food',
      'movie',
      'video',
      'podcast',
      'discussion',
    ).required(),
    tags: Joi.array().items(Joi.string()).optional(),
    authors: Joi.array().items({
      name: Joi.string().required(),
      type: Joi.string().valid(
        'author',
        'singer',
        'composer',
        'actor',
        'actress',
        'director',
      ).required(),
    }).when('type', {
      is: Joi.valid('song', 'book', 'movie', 'podcast'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    coverImage: Joi.object().when('type', {
      is: Joi.valid('food', 'movie', 'book', 'blog'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    isUpload: Joi.boolean().optional(),
    url: Joi.string().when('isUpload', {
      is: false,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    video: Joi.object().keys({}).when('isUpload', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    audio: Joi.object().when('type', {
      is: Joi.valid('song', 'podcast'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    food: Joi.object().keys({
      foodName: Joi.string().required(),
      url: Joi.string().optional(),
      price: Joi.string().required(),
      location: Joi.string().optional(),
      star: Joi.number().optional(),
    }).when('type', {
      is: 'food',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    foodPhotos: Joi.array().when('type', {
      is: 'food',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  });

  req.files = JSON.parse(JSON.stringify(req.files));
  req.body = JSON.parse(JSON.stringify(req.body));

  const reqData = req.body;
  reqData.type = req.query.type;
  reqData.isUpload = req.query.isUpload;
  if (req.files.coverImage) {
    reqData.coverImage = req.files.coverImage[0];
  }
  if (req.files.audio) {
    reqData.audio = req.files.audio[0];
  }

  if (req.files.foodPhotos) {
    reqData.foodPhotos = req.files.foodPhotos.map((photo) => photo);
  }

  const { error } = schema.validate(reqData);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

const validateGetPost = (req, res, next) => {
  const schema = Joi.object().keys({
    postId: Joi.string().length(24),
  });

  req.params = JSON.parse(JSON.stringify(req.params));
  const { error } = schema.validate(req.params);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

module.exports = {
  createPostValidate,
  validateGetPost,
};
