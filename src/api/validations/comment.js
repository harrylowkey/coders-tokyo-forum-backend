const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');

const commentValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    content: Joi.string().not('').required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};


const updateCommentValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    content: Joi.string().not('').required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

module.exports = {
  commentValidate,
  updateCommentValidate,
};
