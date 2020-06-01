const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');


const validatePOST = (req, res, next) => {
  const schema = Joi.object().keys({
    topic: Joi.string().required(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    cover: Joi.object().required(),
    type: Joi.string().optional(),
  });

  const reqData = req.body;
  const { error } = schema.validate(reqData);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

const validatePUT = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    throw Boom.badRequest('Atleast 1 field required');
  }

  const schema = Joi.object().keys({
    topic: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    content: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    cover: Joi.object().optional(),
    type: Joi.string().optional(),
  });

  const reqData = req.body;
  const { error } = schema.validate(reqData);
  if (error) {
    throw Boom.badRequest(error.message);
  }

  return next();
};

module.exports = {
  validatePOST,
  validatePUT,
};
