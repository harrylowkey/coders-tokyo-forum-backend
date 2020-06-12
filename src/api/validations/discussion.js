const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const { audioConfig } = require('@configVar');

const validatePOST = (req, res, next) => {
  const schema = Joi.object().keys({
    topic: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string().min(1).max(16)).optional(),
    type: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

const validatePUT = (req, res, next) => {
  const schema = Joi.object().keys({
    topic: Joi.string().optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string().min(1).max(16)).optional(),
    type: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

module.exports = {
  validatePOST,
  validatePUT,
};
