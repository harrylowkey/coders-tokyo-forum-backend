const Boom = require('@hapi/boom');
const BlogController = require('./blog.controller');
const BookController = require('./book.controller');
const FoodController = require('./food.controller');
const MovieController = require('./movie.controller');
const Post = require('../models').Post;

exports.getOnePost = async (req, res, next) => {
  try {
    const {
      params: { postId },
      query: { type },
    } = req;
    if (!type) {
      throw Boom.badRequest('Type query is required');
    }

    let populateQuery = [
      {
        path: 'tags',
        select: 'tagName',
      },
    ];

    let negativeQuery = '-__v';

    switch (type) {
      case 'blog':
        negativeQuery =
          negativeQuery + ' -authors -mediaInstance -foodInstance';
      case 'book':
        populateQuery.push({
          path: 'authors',
          select: 'name',
        });
        negativeQuery = negativeQuery + ' -mediaInstance -foodInstance';
      case 'food':
        populateQuery.push({
          path: 'foodInstance',
          select: 'foodName url price location star photos',
        });
        negativeQuery = negativeQuery + ' -mediaInstance -authors';
    }

    const post = await Post.findOne({
      _id: postId,
      type: `${type}`,
    })
      .lean()
      .populate(populateQuery)
      .select(negativeQuery);

    if (!post) {
      throw Boom.badRequest(
        `Not found ${
          type == 'blog'
            ? type
            : type === 'song' || type === 'podcast' || type === 'video'
            ? type
            : type + ' blog reivew'
        }`,
      );
    }

    return res.status(200).json({
      status: 200,
      message: 'success',
      data: post,
    });
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
      case 'movie':
        MovieController.createMovieReview(req, res, next);
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
      case 'food':
        FoodController.editFoodReview(req, res, next);
        break;
      case 'movie':
        MovieController.editMovieReview(req, res, next);
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
