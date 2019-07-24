const Joi = require('@hapi/joi');

module.exports = {
  register: {
    body: {
      username: Joi.string().required(),
      email: Joi.string()
        .regex(/^\S+@\S+\.\S+$/)
        .required(),
      password: Joi.string()
        .min(8)
        .max(30)
        .required(),
    },
  },

  login: {
    body: {
      email: Joi.string()
        .regex(/^\S+@\S+\.\S+$/)
        .required(),
      password: Joi.string()
        .regex(/[a-zA-Z0-9]{8,30}/)
        .required(),
    },
  },
};
