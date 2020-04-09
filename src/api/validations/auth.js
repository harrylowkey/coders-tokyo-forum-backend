const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom')
let signUpValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => {
        return {
          message: 'Invalid email',
        };
      }),
    password: Joi.string()
      .regex(/[a-zA-Z0-9]{8,30}/)
      .required()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }
  return next()
}

let loginValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => {
        return {
          message: 'Invalid email',
        };
      }),
    password: Joi.string()
      .regex(/[a-zA-Z0-9]{8,30}/)
      .required()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }
  return next()
}

let forgotPasswordValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    newPassword: Joi.string()
      .regex(/[a-zA-Z0-9]{8,30}/)
      .required()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
    confirmPassword: Joi.string()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
    code: Joi.number().required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }
  return next()
}

let changePasswordValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    newPassword: Joi.string()
      .regex(/[a-zA-Z0-9]{8,30}/)
      .required()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
    confirmPassword: Joi.string()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
    oldPassword: Joi.string()
      .error(() => {
        return {
          message: 'Password must include lower, uppper characters and number',
        };
      }),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }
  return next()
}

let emailCodeValidate = (req, res, next) => {
  let schema = Joi.object().keys({
    email: Joi.string()
      .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
      .required()
      .error(() => {
        return {
          message: 'Invalid email',
        };
      }),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    throw Boom.badRequest(error.message)
  }
  return next()
}



module.exports = {
  signUpValidate,
  loginValidate,
  emailCodeValidate,
  changePasswordValidate,
  forgotPasswordValidate,
};