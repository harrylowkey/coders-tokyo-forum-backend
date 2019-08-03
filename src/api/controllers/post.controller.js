const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const BlogController = require('./blog.controller');
const BookController = require('./book.controller');
const FoodController = require('./food.controller');
const MovieController = require('./movie.controller');
const MediaController = require('./media.controller');
const DiscussionController = require('./discussion.controller');
const Post = require('../models').Post;
const User = require('../models').User;
const Tag = require('../models').Tag;
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
      case 'discussion':
        negativeQuery += '-url -media -authors';
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

exports.getPosts = async (req, res, next) => {
  try {
    const {
      query: { type },
      limit: { limit },
      skip: { skip },
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
      case 'discussion':
        negativeQuery += '-url -media -authors';
    }

    let user;
    let query = { type };
    if (req.params.userId) {
      user = await User.findById(req.params.userId).lean();
      if (!user) {
        throw Boom.notFound(`Not found user to get ${type}s`);
      }
      query.userId = req.params.userId;
    }

    const posts = await Post.find(query)
      .lean()
      .skip(skip)
      .limit(limit)
      .populate(populateQuery)
      .select(negativeQuery);

    if (!posts) {
      throw Boom.notFound(
        `Not found ${
          type == 'blogs'
            ? type
            : type === 'songs' || type === 'podcasts' || type === 'videos'
            ? type
            : type + ' blog reivews'
        }`,
      );
    }

    let metaData = {
      pageSize: req.limit,
      currentPage: req.query.page ? Number(req.query.page) : 1,
    };
    let totalPage = Math.ceil(posts.length / req.limit);
    metaData.totalPage = totalPage;
    return res.status(200).json({
      status: 200,
      message: 'success',
      metaData,
      data: posts,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPostsByTagsName = async (req, res, next) => {
  try {
    const {
      query: { tag },
      limit: { limit },
      skip: { skip },
    } = req;

    let query = { tagName: tag };
    const tagsMatched = await Tag.find(query)
      .lean()
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'posts',
        select: '-__v',
        populate: { path: 'authors', select: 'name type' },
        populate: { path: 'tags', select: 'tagName' },
      })
      .select('-__v');
    if (!tagsMatched) {
      throw Boom.badRequest('Get posts by tag failed');
    }

    let metaData = {
      pageSize: req.limit,
      currentPage: req.query.page ? Number(req.query.page) : 1,
    };
    let totalPage = tagsMatched[0]
      ? Math.ceil(tagsMatched[0].posts.length / req.limit)
      : 0;
    metaData.totalPage = totalPage;
    return res.status(200).json({
      status: 200,
      message: 'success',
      metaData,
      data: tagsMatched,
    });
  } catch (error) {
    console.log(error);
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

exports.likePost = async (req, res, next) => {
  const {
    user,
    params: { postId },
  } = req;

  try {
    const post = await Post.findById(postId).lean();
    if (!post) {
      throw Boom.badRequest('Not found post to like');
    }

    try {
      await Promise.props({
        pushUserIdToPost: Post.findByIdAndUpdate(
          postId,
          {
            $push: { likes: user._id },
          },
          { new: true },
        ),
        pushlikedPostToUser: User.findByIdAndUpdate(
          user._id,
          {
            $push: { likedPosts: postId },
          },
          { new: true },
        ),
      });

      return res.status(200).json({
        status: 200,
        message: 'Like post succesfully',
      });
    } catch (error) {
      throw Boom.badRequest('Like post failed, try later');
    }
  } catch (error) {
    return next(error);
  }
};
