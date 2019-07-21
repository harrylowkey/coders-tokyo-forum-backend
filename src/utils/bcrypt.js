const bcrypt = require('bcrypt');
const User = require('../api/models/user.model').model;

module.exports = {
  comparePassword : (password, hashPassword) => {
    return bcrypt.compareSync(password, hashPassword)
  }
}