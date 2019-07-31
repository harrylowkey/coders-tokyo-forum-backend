const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Media = require('../models').Media;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createMovieReview = async (req, res, next) => {
  const coverImage = req.files['coverImage'][0].path;
  const {
    body: { tags, url, authors },
    user,
  } = req;

  try {
    const newMovieReview = new Post({
      userId: user,
      ...req.body,
      type: 'movie',
    });

    const movieInstance = new Media({
      postId: newMovieReview,
      url,
      type: 'movie',
    });

    const result = await Promise.props({
      tags: Utils.post.createTags(newMovieReview, tags),
      authors: Utils.post.creatAuthors(newMovieReview, authors),
      coverImage: Utils.cloudinary.uploadCoverImage(coverImage),
    });

    if (!result.tags || !result.authors || !result.coverImage) {
      throw Boom.serverUnavailable(
        'Create tag and upload co and authors ver image false',
      );
    }

    const tagsId = result.tags.map(tag => ({
      _id: tag.id,
    }));

    const authorsId = result.authors.map(author => ({
      _id: author.id,
    }));

    const cover = {
      public_id: result.coverImage.public_id,
      url: result.coverImage.url,
      secure_url: result.coverImage.secure_url,
    };

    newMovieReview.mediaInstance = movieInstance;
    newMovieReview.tags = tagsId;
    newMovieReview.authors = authorsId;
    newMovieReview.cover = cover;

    try {
      const isOk = await Promise.props({
        pushBlogIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newMovieReview },
          },
          { new: true },
        ),
        createMovieInstace: movieInstance,
        createNewBlog: newMovieReview.save(),
      });

      const movieBlog = await Post.findById(isOk.createNewBlog._id)
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          { path: 'authors', select: 'name type' },
        ])
        .select('-__v -mediaInstance -foodInstance');

      return res.status(200).json({
        status: 200,
        message: 'Create new movie blog review successfully',
        data: movieBlog,
      });
    } catch (error) {
      throw Boom.badRequest('Create new movie blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};
