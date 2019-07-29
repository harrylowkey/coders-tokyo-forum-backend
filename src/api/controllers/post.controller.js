const Boom = require('@hapi/boom');
const BlogController = require('./blog.controller');

exports.createPost = (req, res, next) => {
  try {
    const type = req.query.type;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    switch (type) {
      case 'blog':
        BlogController.createBlog(req, res, next);
        break;
      case 'book':
        createBookReview(req, res, next);
        break;
      case 'food':
        createFoodReview(req, res, next);
        break;
      case 'movie':
        createMovieReview(req, res, next);
        break;
      case 'video':
        createVideo(req, res, next);
        break;
      case 'song':
        createSong(req, res, next);
        break;
      case 'podcast':
        createPodCast(req, res, next);
        break;
      default:
        createStatus(req, res, next);
    }
  } catch (error) {
    return next(error);
  }
};

exports.editPost = (req, res, next) => {
  try {
    const type = req.query.type;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    switch (type) {
      case 'blog':
        BlogController.editBlog(req, res, next);
        break;
    }
  } catch (error) {
    return next();
  }
};

exports.deletePost = (req, res, next) => {
  try {
    const type = req.query.type;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    switch (type) {
      case 'blog':
        BlogController.deleteBlog(req, res, next);
        break;
    }
  } catch (error) {
    return next();
  }
};

const createStatus = async (req, res, next) => {
  return res.status(200).json('create status');
};

const createBookReview = async (req, res, next) => {
  return res.status(200).json('create book review');
};

const createFoodReview = async (req, res, next) => {
  return res.status(200).json('create food review');
};

const createMovieReview = async (req, res, next) => {
  return res.status(200).json('create movie review ');
};

const createVideo = async (req, res, next) => {
  return res.status(200).json('create video');
};

const createSong = async (req, res, next) => {
  return res.status(200).json('create song');
};

const createPodCast = async (req, res, next) => {
  return res.status(200).json('create pod cast');
};
