const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const mongoose = require('mongoose')
const BlogController = require('./blog.controller');
const BookController = require('./book.controller');
const FoodController = require('./food.controller');
const MovieController = require('./movie.controller');
const MediaController = require('./media.controller');
const DiscussionController = require('./discussion.controller');
const Post = require('@models').Post;
const User = require('@models').User;
const Tag = require('@models').Tag;
const Utils = require('@utils')
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

//TODO: Validate req body
exports.getOnePost = async (req, res, next) => {
  try {
    const {
      params: { postId },
      query: { type, limitComment, pageComment },
    } = req;
    const [_pageComment, _limitComment] = Utils.post.standardizePageLimitComment5(pageComment, limitComment)
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
      {
        path: 'likes',
        select: 'username',
      },
      {
        path: 'savedBy',
        select: 'username',
      },
      {
        path: 'comments',
        select: '-__v',
        options: {
          sort: { createdAt: -1 },
          limit: _limitComment,
          skip: (_pageComment - 1) * _limitComment 
        },
        populate: {
          path: 'userId',
          select: '_id username'
        },
        populate: {
          path: 'childComments',
          select: '-__v',
          options: {
            sort: { createdAt: -1 },
          }
        }
      }
    ];

    let negativeQuery = '-__v ';

    switch (type) {
      case 'blog':
        negativeQuery += '-authors -url -media';
        break;
      case 'book':
        populateQuery.push({
          path: 'authors',
          select: 'name',
        });
        negativeQuery += '-url -media';
        break;
      case 'food':
        negativeQuery += '-authors -media';
        break;
      case 'movie':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-media';
        break;
      case 'video':
        negativeQuery += '-authors';
        break;
      case 'podcast':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'song':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'discussion':
        negativeQuery += '-url -media -authors';
        break;
    }

    const [post, counter] = await Promise.all([
      Post.findOne({
        _id: postId,
        type,
      })
        .lean()
        .populate(populateQuery)
        .select(negativeQuery),
        Post.aggregate([
          {
            $match: {
              _id: mongoose.Types.ObjectId(postId),
              type,
            },
          },
          {
            $project: {
              comments: { $size: '$comments'},
              likes: { $size: '$likes'},
              saves: { $size: '$savedBy'}
            }
          }
        ]
        )
    ])

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
    let metadata = {
      totalLikes: counter[0].likes,
      totalComments: counter[0].comments,
      totalSaves: counter[0].saves,
      comment: Utils.post.getmetadata( _pageComment, _limitComment, counter[0].comments)
    }
    return res.status(200).json({
      status: 200,
      metadata,
      data: post
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const {
      query: { type },
      limit,
      page,
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
        select: 'tagName _id',
      },
      {
        path: 'likes',
        select: 'username _id',
      },
      {
        path: 'comments',
        select: '-__v',
        populate: {
          path: 'userId',
          select: '_id username'
        }
      }
    ];

    let negativeQuery = '-__v ';

    switch (type) {
      case 'blog':
        negativeQuery += '-authors -url -media';
        break;
      case 'book':
        populateQuery.push({
          path: 'authors',
          select: 'name',
        });
        negativeQuery += '-url -media';
        break;
      case 'food':
        negativeQuery += '-authors -media';
        break;
      case 'movie':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-media';
        break;
      case 'video':
        negativeQuery += '-authors';
        break;
      case 'podcast':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'song':
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'discussion':
        negativeQuery += '-url -media -authors';
        break;
    }

    let user;
    let query = { type };
    if (req.params.userId) {
      user = await User.findById(req.params.userId).lean();
      if (!user) {
        throw Boom.badRequest(`Not found user to get ${type}s`);
      }
      query.userId = req.params.userId;
    }

    const [posts, counter] = await Promise.all([
      Post.find(query)
        .lean()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populateQuery)
        .select(negativeQuery),
      Post.count(query).lean()
    ])

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata(page, limit, counter),
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
      limit,
      page,
    } = req;


    const tagIds = [];
    //case 1 tag
    if (typeof tag === 'string') {
      const existedTag = await Tag.findOne({ tagName: tag })
      if (!existedTag) {
        return res.status(200).json({
          status: 200,
          metadata: Utils.post.getmetadata(1, 1, 0),
          data: [],
        });
      }
      tagIds.push(existedTag._id)
    }

    // case >= 2 tags
    if (typeof tag === 'object') {
      const promises = []
      tag.map(tag => {
        promises.push(Tag.findOne({ tagName: tag }))
      })
      const tags = await Promise.all(promises)
      tags.map(tag => {
        if (tag && tag.tagName) {
          tagIds.push(tag._id)
        }
      })
    }

    const [posts, counter] = await Promise.all([
      Post.find({
        tags: { $in: tagIds }
      })
        .lean()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'authors', select: '_id name type' })
        .populate({ path: 'tags', select: '_id tagName' })
        .populate({ path: 'likes', select: '_id username' })
        .populate({
          path: 'comments',
          select: '-__v',
          populate: {
            path: 'userId',
            select: '_id username'
          }
        }),
      Post.count({
        tags: { $in: tagIds }
      })
        .lean()
    ])

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata(page, limit, counter),
      data: posts,
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
        MediaController.createAudio(req, res, next, type);
        break;
      case 'podcast':
        MediaController.createAudio(req, res, next, type);
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
        MediaController.editAudio(req, res, next, type);
        break;
      case 'podcast':
        MediaController.editAudio(req, res, next, type);
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
        MediaController.deleteAudio(req, res, next, type);
        break;
      case 'podcast':
        MediaController.deleteAudio(req, res, next, type);
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
      throw Boom.badRequest('Not found post');
    }

    await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: { likes: user._id },
      },
      { new: true, upsert: true },
    )

    return res.status(200).json({
      status: 200,
      message: 'Like post succesfully',
    });
  } catch (error) {
    console.log(error)
    return next(error);
  }
};

exports.unlikePost = async (req, res, next) => {
  const {
    user,
    params: { postId },
  } = req;

  try {
    const post = await Post.findById(postId).lean();
    if (!post) {
      throw Boom.badRequest('Not found post')
    }

    await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: user._id },
      },
      { new: true },
    )

    return res.status(200).json({
      status: 200,
      message: 'Unlike post succesfully',
    });
  } catch (error) {
    return next(error);
  }
};

exports.savePost = async (req, res, next) => {
  const {
    user,
    params: { postId },
  } = req;

  try {
    const post = await Post.findById(postId).lean();
    if (!post) {
      throw Boom.badRequest('Not found post to save');
    }

    await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: { savedBy: user._id },
      },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: 200,
      message: 'Save post succesfully',
    });

  } catch (error) {
    console.log(error)
    return next(error);
  }
};

exports.unsavePost = async (req, res, next) => {
  const {
    user,
    params: { postId },
  } = req;

  try {
    const post = await Post.findById(postId).lean();
    if (!post) {
      throw Boom.badRequest('Not found post to unsave');
    }

    await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { savedBy: user._id },
      },
      { new: true },
    );

    return res.status(200).json({
      status: 200,
      message: 'Unsave post succesfully',
    });

  } catch (error) {
    return next(error);
  }
};

exports.getSavedPosts = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      params: { userId },
    } = req;

    const [counter, posts] = await Promise.all([
      Post.count({ savedBy: { $in: [userId] } }).lean(),
      Post.find({ savedBy: { $in: [userId] } })
        .lean()
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'savedBy',
          select: '_id username',
        })
        .populate({ path: 'authors', select: '_id name type' })
        .populate({ path: 'tags', select: '_id tagName' })
        .populate({ path: 'likes', select: '_id username' })
        .populate({
          path: 'comments',
          select: '-__v',
          populate: {
            path: 'userId',
            select: '_id username'
          }
        })
    ])

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata(page, limit, counter),
      data: posts,
    });
  } catch (error) {
    return next(error);
  }
};
