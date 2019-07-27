const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Author = require('../models').Author;
const Food = require('../models/').Food;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createPost = async (req, res, next) => {
  console.log('post controller');
};
