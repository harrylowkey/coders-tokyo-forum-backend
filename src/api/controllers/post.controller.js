const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const BlogController = require('./blog.controller');
const BookController = require('./book.controller');
const FoodController = require('./food.controller');
const MovieController = require('./movie.controller');
const MediaController = require('./media.controller');
const DiscussionController = require('./discussion.controller');
const { Post, User, Tag } = require('@models');
const Utils = require('@utils');
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

/** ------------------ GET ------------------------- */
exports.getOnePost = async (req, res, next) => {
  try {
    const {
      params: { postId },
      query: { type, limitComment, pageComment },
    } = req;

    const [_pageComment, _limitComment] = Utils.post.standardizePageLimitComment5(pageComment, limitComment);
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
        path: 'cover',
        select: '_id secureURL',
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
          path: 'user',
          select: '_id username'
        },
        populate: {
          path: 'childComments',
          select: 'content createdAt parentId',
          options: {
            sort: { createdAt: -1 }
          },
          populate: [
            {
              path: 'replyToComment',
              select: 'user',
              populate: {
                path: 'user',
                select: 'username job'
              }
            },
            {
              path: 'user',
              select: 'username'
            }
          ]
        },
      },
      {
        path: 'user',
        select: '_id username job createdAt description sex followers following avatar socialLinks',
        populate: {
          path: 'avatar',
          select: '_id secureURL'
        }
      },
      {
        path: 'media',
      },
    ];

    let negativeQuery = '-__v ';

    switch (type) {
      case 'blog':
        negativeQuery += '-authors -url -media';
        break;
      case 'book':
        populateQuery.push({
          path: 'authors',
          select: 'name type',
        });
        negativeQuery += '-url -media';
        break;
      case 'food':
        populateQuery.push({
          path: 'foodPhotos',
        });
        negativeQuery += '-authors -media -url';
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
            comments: { $size: '$comments' },
            likes: { $size: '$likes' },
            saves: { $size: '$savedBy' }
          }
        }
      ])
    ]);

    if (!post) {
      throw Boom.badRequest('Not found post');
    }

    let metadata = {
      likes: counter[0].likes,
      comments: counter[0].comments,
      saves: counter[0].saves,
      comment: Utils.post.getmetadata(_pageComment, _limitComment, counter[0].comments)
    };

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
        path: 'cover',
        select: '_id secureURL',
      },
      {
        path: 'comments',
        select: '-__v',
        populate: {
          path: 'user',
        }
      },
      {
        path: 'user',
        select: '_id username job createdAt description sex followers following avatar socialLinks',
        populate: {
          path: 'avatar',
          select: '_id secureURL'
        }
      },
      {
        path: 'media',
      },
    ];

    let negativeQuery = '-__v ';

    let limit = 5;
    let page = 1;
    switch (type) {
      case 'blog':
        negativeQuery += '-authors -url -media';
        populateQuery.push({ path: 'cover' });
        break;
      case 'book':
        populateQuery.push({ path: 'authors', select: 'name' });
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
        populateQuery.push({ path: 'cover' });
        break;
      case 'podcast':
        limit = 6;
        page = 1;
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'song':
        limit = 6;
        page = 1;
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'discussion':
        limit = 10;
        page = 1;
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
      query.user = req.params.userId;
    }

    const [posts, postCounter] = await Promise.all([
      Post.find(query)
        .lean()
        .skip(((Number(req.query.page) || page) - 1) * (Number(req.query.limit) || limit))
        .limit(Number(req.query.limit) || limit)
        .populate(populateQuery)
        .select(negativeQuery)
        .sort({ createdAt: -1 }),
      Post.countDocuments(query).lean()
    ]);

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata((Number(req.query.page) || page), (Number(req.query.limit) || limit), postCounter),
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

    const [ _page, _limit] = Utils.post.standardizePageLimit5(page, limit)

    const tagIds = [];
    //case 1 tag
    if (typeof tag === 'string') {
      const existedTag = await Tag.findOne({ tagName: tag });
      if (!existedTag) {
        return res.status(200).json({
          status: 200,
          metadata: Utils.post.getmetadata(1, 1, 0),
          data: [],
        });
      }
      tagIds.push(existedTag._id);
    }

    // case >= 2 tags
    if (typeof tag === 'object') {
      const promises = [];
      tag.map(tag => {
        promises.push(Tag.findOne({ tagName: tag }));
      });
      const tags = await Promise.all(promises);
      tags.map(tag => {
        if (tag && tag.tagName) {
          tagIds.push(tag._id);
        }
      });
    }

    const [posts, postCounter, counter] = await Promise.all([
      Post.find({
        tags: { $all: tagIds }
      })
        .lean()
        .skip((_page - 1) * _limit)
        .limit(_limit)
        .sort({ createdAt: -1 })
        .populate([
          {
            path: 'cover',
            select: '_id secureURL',
          },
          {
            path: 'authors', select: '_id name type'
          },
          { path: 'tags', select: '_id tagName' },
          { path: 'likes', select: '_id username' },
          {
            path: 'comments',
            select: '-__v',
            populate: {
              path: 'user',
              select: '_id username'
            }
          },
          {
            path: 'user',
            select: '_id username job createdAt description sex followers following avatar socialLinks',
            populate: {
              path: 'avatar',
              select: '_id secureURL'
            }
          },
          {
            path: 'media',
          },
        ]),
      Post.countDocuments({
        tags: { $all: tagIds }
      }).lean(),
      Post.aggregate([
        {
          $match: {
            tags: { $all: tagIds }
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            comments: { $size: '$comments' },
            likes: { $size: '$likes' },
            saves: { $size: '$savedBy' }
          }
        }
      ])
    ]);

    const data = posts.map((post, index) => {
      if (post._id.toString() === counter[index]._id.toString()) {
        let metadata = { ...counter[index] };
        return { ...post, metadata };
      }
      return { ...post };
    });

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata(page, limit, postCounter),
      data,
    });
  } catch (error) {
    return next(error);
  }
};


/** ------------------- POST ---------------------------- */

exports.createVideo = (req, res, next) => {
  MediaController.createVideo(req, res, next, 'video', req.query.isUpload);
};

/** ------------------ PUT ---------------------------------- */



exports.editVideo = (req, res, next) => {
  MediaController.editVideo(req, res, next, 'video', req.query.isUpload);
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

    const isLiked = post.likes.includes(user._id);
    if (isLiked) {
      throw Boom.conflict('You liked');
    }


    await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: { likes: user._id },
      },
      { new: true },
    );

    return res.status(200).json({
      status: 200,
      message: 'Like post succesfully',
    });
  } catch (error) {
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
      throw Boom.badRequest('Not found post');
    }

    await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: user._id.toString() },
      },
      { new: true },
    );

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
        select: 'tagName _id',
      },
      {
        path: 'likes',
        select: 'username _id',
      },
      {
        path: 'cover',
        select: '_id secureURL',
      },
      {
        path: 'comments',
        select: '-__v',
        populate: {
          path: 'user',
        }
      },
      {
        path: 'user',
        select: '_id username job createdAt description sex followers following avatar socialLinks',
        populate: {
          path: 'avatar',
          select: '_id secureURL'
        }
      },
      {
        path: 'media',
      },
    ];

    let negativeQuery = '-__v ';

    let limit = 5;
    let page = 1;
    switch (type) {
      case 'blog':
        negativeQuery += '-authors -url -media';
        populateQuery.push({ path: 'cover' });
        break;
      case 'book':
        populateQuery.push({ path: 'authors', select: 'name' });
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
        populateQuery.push({ path: 'cover' });
        break;
      case 'podcast':
        limit = 6;
        page = 1;
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'song':
        limit = 6;
        page = 1;
        populateQuery.push({ path: 'authors', select: 'name type' });
        negativeQuery += '-url';
        break;
      case 'discussion':
        limit = 10;
        page = 1;
        negativeQuery += '-url -media -authors';
        break;
    }

    let query = { type, savedBy: { $in: [req.user._id] } };

    const [posts, postCounter] = await Promise.all([
      Post.find(query)
        .lean()
        .skip(((Number(req.query.page) || page) - 1) * (Number(req.query.limit) || limit))
        .limit(Number(req.query.limit) || limit)
        .populate(populateQuery)
        .select(negativeQuery)
        .sort({ createdAt: -1 }),
      Post.countDocuments(query).lean()
    ]);

    return res.status(200).json({
      status: 200,
      metadata: Utils.post.getmetadata((Number(req.query.page) || page), (Number(req.query.limit) || limit), postCounter),
      data: posts,
    });
  } catch (error) {
    return next(error);
  }
};
