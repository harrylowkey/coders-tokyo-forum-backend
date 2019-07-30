const Boom = require('@hapi/boom');
const BlogController = require('./blog.controller');
const BookController = require('./book.controller');
const FoodController = require('./food.controller');

exports.getOnePost = async (req, res, next) => {
  try {
    const type = req.query.type;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    switch (type) {
      case 'blog':
        BlogController.getOneBlog(req, res, next);
        break;
      case 'book':
        BookController.getOneBookReview(req, res, next);
        break;
      case 'food':
        FoodController.getOneFoodReview(req, res, next);
        break;
    }
  } catch (error) {
    return next(error);
  }
};

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
        BookController.createBookReview(req, res, next);
        break;
      case 'food':
        FoodController.createFoodReview(req, res, next);
        break;
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
      case 'book':
        BookController.editBookReview(req, res, next);
        break;
    }
  } catch (error) {
    return next();
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const type = req.query.type;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }

    switch (type) {
      case 'blog':
        BlogController.deleteBlog(req, res, next);
        break;
      case 'book':
        BookController.deleteBookReview(req, res, next);
        break;
      case 'food':
        FoodController.deleteFoodReview(req, res, next);
        break;
    }
  } catch (error) {
    return next(error);
  }
};
