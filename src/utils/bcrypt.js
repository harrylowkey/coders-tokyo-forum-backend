const bcrypt = require('bcrypt');

module.exports = {
  comparePassword: (password, hashPassword) => bcrypt.compareSync(password, hashPassword),
};
