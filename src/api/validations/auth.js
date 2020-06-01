const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');

const signUpValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => ({
        message: 'Invalid email',
      })),
    password: Joi.string()
      .min(8)
      .max(30)
      .regex(/[a-zA-Z0-9]/)
      .required()
      .error(() => ({
        message: 'Password must include lower, uppper characters and number',
      })),
    confirmPassword: Joi.string()
      .error(() => ({
        message: 'Password must include lower, uppper characters and number',
      })),
    code: Joi.number().required(),
    sex: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }
  return next();
};

const loginValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => ({
        message: 'Invalid email',
      })),
    password: Joi.string()
      .required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }
  return next();
};

const forgotPasswordValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    newPassword: Joi.string()
      .min(8)
      .max(30)
      .regex(/[a-zA-Z0-9]/)
      .required()
      .error(() => ({
        message: 'Password must include lower, uppper characters and number',
      })),
    confirmPassword: Joi.string()
      .error(() => ({
        message: 'Password must include lower, uppper characters and number',
      })),
    code: Joi.number().required(),
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => ({
        message: 'Invalid email',
      })),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }
  return next();
};

const changePasswordValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    newPassword: Joi.string()
      .min(8)
      .max(30)
      .regex(/[a-zA-Z0-9]/)
      .required()
      .error(() => ({
        message: 'Password must include lower, uppper characters and number',
      })),
    confirmPassword: Joi.string()
      .min(8)
      .max(30)
      .regex(/[a-zA-Z0-9]/)
      .required()
      .error(() => ({
        message: 'Password must include lower, uppper characters and number',
      })),
    oldPassword: Joi.string().required(),
    code: Joi.number().required(),
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => ({
        message: 'Invalid email',
      })),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }
  return next();
};

const emailCodeValidate = (req, res, next) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => ({
        message: 'Invalid email',
      })),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw Boom.badRequest(error.message);
  }
  return next();
};


module.exports = {
  signUpValidate,
  loginValidate,
  emailCodeValidate,
  changePasswordValidate,
  forgotPasswordValidate,
};
