const Boom = require('@hapi/boom');
const BlogController = require('./blog.controller');
const BookController = require('./book.controller');
const FoodController = require('./food.controller');
const MovieController = require('./movie.controller');
const MediaController = require('./media.controller');
const DiscussionController = require('./discussion.controller');
const Post = require('../models').Post;
const types = [
  'discussion',
  'blog',
  'book',
  'food',
  'movie',
  'video',
  'song',
  'podcast',
];

exports.getOnePost = async (req, res, next) => {
  try {
    const {
      params: { postId },
      query: { type },
    } = req;
    if (!type) {
      throw Boom.badRequest('Type query is required');
    }
    if (!types.includes(type)) {
      throw Boom.badRequest(`This ${type} type is not supported yet`);
    }

    let populateQuery = [
      {
        path: 'tags',
        select: 'tagName',
      },
    ];

    let negativeQuery = '-__v ';

    switch (type) {
      case 'blog':
        negativeQuery += '-authors -url -media';
      case 'book':
        populateQuery.push({
          path: 'authors',
          select: 'name',
        });
        negativeQuery += '-url -media';
      case 'food':
        negativeQuery += '-authors -media';
      case 'movie':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-media';
      case 'video':
        negativeQuery += '-authors';
      case 'podcast':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
      case 'song':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
    }

    const post = await Post.findOne({
      _id: postId,
      type: `${type}`,
    })
      .lean()
      .populate(populateQuery)
      .select(negativeQuery);

    if (!post) {
      throw Boom.notFound(
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
    const { type, isUpload } = req.query;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    if (!types.includes(type)) {
      throw Boom.badRequest(`This ${type} type is not supported yet`);
    }
    switch (type) {
      case 'blog':
        BlogController.createBlog(req, res, next, type);
        break;
      case 'book':
        BookController.createBookReview(req, res, next, type);
        break;
      case 'food':
        FoodController.createFoodReview(req, res, next, type);
        break;
      case 'movie':
        MovieController.createMovieReview(req, res, next, type);
        break;
      case 'video':
        MediaController.createVideo(req, res, next, type, isUpload);
        break;
      case 'song':
        MediaController.createMedia(req, res, next, type);
        break;
      case 'podcast':
        MediaController.createMedia(req, res, next, type);
        break;
      case 'discussion':
        DiscussionController.createDiscussion(req, res, next, type);
        break;
    }
  } catch (error) {
    return next(error);
  }
};

exports.editPost = (req, res, next) => {
  try {
    const { type, isUpload } = req.query;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    if (!types.includes(type)) {
      throw Boom.badRequest(`This ${type} type is not supported yet`);
    }
    switch (type) {
      case 'blog':
        BlogController.editBlog(req, res, next, type);
        break;
      case 'book':
        BookController.editBookReview(req, res, next, type);
        break;
      case 'food':
        FoodController.editFoodReview(req, res, next, type);
        break;
      case 'movie':
        MovieController.editMovieReview(req, res, next, type);
        break;
      case 'video':
        MediaController.editVideo(req, res, next, type, isUpload);
        break;
      case 'song':
        MediaController.editMedia(req, res, next, type);
        break;
      case 'podcast':
        MediaController.editMedia(req, res, next, type);
        break;
      case 'discussion':
        DiscussionController.editDiscussion(req, res, next, type);
        break;
    }
  } catch (error) {
    return next();
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const { type } = req.query;
    if (!type) {
      throw Boom.badRequest('Type is required');
    }
    if (!types.includes(type)) {
      throw Boom.badRequest(`This ${type} type is not supported yet`);
    }

    switch (type) {
      case 'blog':
        BlogController.deleteBlog(req, res, next, type);
        break;
      case 'book':
        BookController.deleteBookReview(req, res, next, type);
        break;
      case 'food':
        FoodController.deleteFoodReview(req, res, next, type);
        break;
      case 'movie':
        MovieController.deleteMovieReview(req, res, next, type);
        break;
      case 'video':
        MediaController.deleteVideo(req, res, next, type);
        break;
      case 'song':
        MediaController.deleteMedia(req, res, next, type);
        break;
      case 'podcast':
        MediaController.deleteMedia(req, res, next, type);
        break;
      case 'discussion':
        DiscussionController.deleteDiscussion(req, res, next, type);
        break;
    }
  } catch (error) {
    return next(error);
  }
};
