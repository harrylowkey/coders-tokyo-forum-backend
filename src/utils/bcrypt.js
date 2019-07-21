const bcrypt = require('bcrypt');
const User = require('../api/models/user.model').model;

module.exports = {
  comparePassword : async (id, password) => {
    const user = await User.findById(id);
    return bcrypt.compareSync(user.password, password)
  }
}