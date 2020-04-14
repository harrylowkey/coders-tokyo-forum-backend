const Boom = require('@hapi/boom');
const Promise = require('bluebird');
const Post = require('@models').Post;
const Utils = require('@utils')

exports.index = async (req, res, next) => {
  const { page, limit } = req;
    try {
      const result = await Promise.props({
        newestBlogs: Post.find({
          type: 'blog',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate({ path: 'tags', select: 'tagName' })
          .select('-__v -media -url -authors')
          .skip((page - 1) * limit)
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
          .skip((page - 1) * limit)
          .limit(limit),

        newestFoodReviews: Post.find({
          type: 'food',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate({ path: 'tags', select: 'tagName' })
          .select('-__v -media -authors')
          .skip((page - 1) * limit)
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
          .skip((page - 1) * limit)
          .limit(limit),

        newestVideos: Post.find({
          type: 'video',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate([{ path: 'tags', select: 'tagName' }])
          .select('-__v -authors')
          .skip((page - 1) * limit)
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
          .skip((page - 1) * limit)
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
          .skip((page - 1) * limit)
          .limit(limit),

        newestDiscussions: Post.find({
          type: 'discussion',
        })
          .lean()
          .sort({ createdAt: -1 })
          .populate({ path: 'tags', select: 'tagName ' })
          .select(' -__v -url -media -authors')
          .skip((page - 1) * limit)
          .limit(limit),
        counter: Post.count({}).lean(),
      });

      let posts = [];
      posts = Object.keys(result).reduce((postsArr, key) => {
        let object = {};
        object[key] = result[key];
        return [...postsArr, object];
      }, []);
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
