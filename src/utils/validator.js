const Boom = require('@hapi/boom');

const validatePassword = (password) => {
  const error = [];
  if (password === '') {
    throw Boom.badRequest('Password cannot be blank!');
  }
  let re = /((?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20})/;
  if (!re.test(password)) {
    error.push('');
    throw Boom.badRequest('Password should contain\
      at least 8 characters, a lowercase, uppercase\
      and contain at most 20 characters!');
  }

  re = /\s/;
  if (re.test(password)) return false;

  return true;
};

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};
module.exports = {
  validatePassword,
  validateEmail,
};
