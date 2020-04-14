const bcrypt = require('bcrypt');

module.exports = {
  comparePassword : (password, hashPassword) => {
    return bcrypt.compareSync(password, hashPassword)
  }
}