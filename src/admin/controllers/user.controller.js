const User = require('../models/user.model').model;
const httpStatus = require('http-status');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  return res.status(httpStatus.OK).json(user);
};

exports.register = async (req, res) => {
  const isExistingEmail = await User.findOne({ email: req.body.email });
  try {
    if (isExistingEmail) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ status: httpStatus.CONFLICT, message: 'Email taken' });
    }
    const newUser = await User.create(req.body);
    return res.status(httpStatus.OK).json(newUser);
  } catch (error) {
    return res
      .status(error.status)
      .json({ status: error.status, message: error.message });
  }
};
