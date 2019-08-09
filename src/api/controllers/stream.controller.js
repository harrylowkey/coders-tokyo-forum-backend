const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const Post = require('../models').Post;

exports.index = async (req, res, next) => {
  const { skip, limit } = req;

  try {
    try {
      const result = await Promise.props({
        newestBlogs: Post.find({
          type: 'blog',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate({ path: 'tags', select: 'tagName' })
          .select('-__v -media -url -authors')
          .skip(skip)
          .limit(limit), 
        newestBookReviews: Post.find({
          type: 'book',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate([
            { path: 'tags', select: 'tagName' },
            { path: 'authors', select: 'name' },
          ])
          .select('-__v -media -url')
          .skip(skip)
          .limit(limit),

        newestFoodReviews: Post.find({
          type: 'food',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate({ path: 'tags', select: 'tagName' })
          .select('-__v -media -authors')
          .skip(skip)
          .limit(limit),

        newestMovieReviews: Post.find({
          type: 'movie',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate([
            { path: 'tags', select: 'tagName' },
            { path: 'authors', select: 'name type' },
          ])
          .select('-__v -media')
          .skip(skip)
          .limit(limit),

        newestVideos: Post.find({
          type: 'video',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate([{ path: 'tags', select: 'tagName' }])
          .select('-__v -authors')
          .skip(skip)
          .limit(limit),

        newestSongs: Post.find({
          type: 'song',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate([
            { path: 'tags', select: 'tagName' },
            { path: 'authors', select: 'name type' },
          ])
          .select('-__v -url')
          .skip(skip)
          .limit(limit),

        newestPodcasts: Post.find({
          type: 'podcast',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate([
            { path: 'tags', select: 'tagName' },
            { path: 'authors', select: 'name type' },
          ])
          .select('-__v -url')
          .skip(skip)
          .limit(limit),

        newestDiscussions: Post.find({
          type: 'discussion',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate({ path: 'tags', select: 'tagName ' })
          .select(' -__v -url -media -authors')
          .skip(skip)
          .limit(limit),
        total: Post.find({}).lean(),
      });
      let totalPage = Math.ceil(result.total.length / limit);
      let metaData = {
        totalPage,
        pageSize: limit,
        currentPage: req.query.page ? Number(req.query.page) : 1,
      };

      let posts = [];
      posts = Object.keys(result).reduce((postsArr, key) => {
        let object = {};
        object[key] = result[key];
        return [...postsArr, object];
      }, []);
      return res.status(200).json({
        status: 200,
        message: 'Get newest posts successfully',
        metaData,
        data: posts,
      });
    } catch (error) {
      throw Boom.badRequest(error.message);
    }
  } catch (error) {
    return next(error);
  }
};
