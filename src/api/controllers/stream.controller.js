const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const Post = require('@models').Post;
const PostSchema = require('../models/post.model').schema
const Utils = require('@utils')
const mongoose = require('mongoose')
const deepPopulate = require('mongoose-deep-populate')(mongoose);
PostSchema.plugin(deepPopulate, {});

exports.index = async (req, res, next) => {
  const { page, limit } = req;
  try {
    const generalPopulates = [
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
    ]
    const result = await Promise.props({
      newestBlogs: Post.find({
        type: 'blog',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate(generalPopulates)
        .select('-__v -media -url -authors')
        .skip((page - 1) * limit)
        .limit(limit),
      newestBookReviews: Post.find({
        type: 'book',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate(generalPopulates)
        .select('-__v -media -url')
        .skip((page - 1) * limit)
        .limit(limit),

      newestFoodReviews: Post.find({
        type: 'food',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate(generalPopulates)
        .select('-__v -media -authors')
        .skip((page - 1) * limit)
        .limit(limit),

      newestMovieReviews: Post.find({
        type: 'movie',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate([...generalPopulates,
          { path: 'authors', select: 'name type' }
        ])
        .select('-__v -media')
        .skip((page - 1) * limit)
        .limit(limit),

      newestSongs: Post.find({
        type: 'song',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate([...generalPopulates, { path: 'authors', select: 'name type' }, { path: 'media' }])
        .select('-__v -url')
        .skip((page - 1) * limit)
        .limit(limit),

      newestPodcasts: Post.find({
        type: 'podcast',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate([...generalPopulates, { path: 'authors', select: 'name type' }, { path: 'media' }])
        .select('-__v -url')
        .skip((page - 1) * 6)
        .limit(6),

      newestDiscussions: Post.find({
        type: 'discussion',
      })
        .lean()
        .sort({ createdAt: -1 })
        .populate(generalPopulates)
        .select(' -__v -url -media -authors')
        .skip((page - 1) * 10)
        .limit(10),
      counter: Post.countDocuments({}).lean(),
    });

    let posts = {}
    Object.keys(result).map(key => {
      posts[key] = result[key];
    })
    return res.status(200).json({
      status: 200,
      message: 'Get newest posts successfully',
      metadata: Utils.post.getmetadata(page, limit, result.counter),
      data: posts,
    });
  } catch (error) {
    return next(error);
  }
};
