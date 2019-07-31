const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createMovieReview = async (req, res, next) => {
  const coverImage = req.files['coverImage'][0].path;
  const {
    body: { tags, authors },
    user,
  } = req;

  try {
    const newMovieReview = new Post({
      userId: user,
      ...req.body,
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
        createNewBlog: newMovieReview.save(),
      });

      const movieBlog = await Post.findById(isOk.createNewBlog._id)
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          { path: 'authors', select: 'name type' },
        ])
        .select('-__v -foodInstance');

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

exports.editMovieReview = async (req, res, next) => {
  const { topic, description, content, tags, authors, url } = req.body;
  try {
    const movieReview = await Post.findOne({
      _id: req.params.postId,
      type: 'movie',
    }).lean();
    if (!movieReview) {
      throw Boom.badRequest('Not found food blog reivew, edit failed');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (url) query.url = url;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        movieReview._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }

      const newTagsId = newTags.map(newTag => newTag._id);
      query.tags = newTagsId;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        movieReview._id,
        authors,
      );

      if (!authors) {
        throw Boom.serverUnavailable('Get new authors failed');
      }

      const newAuthorsId = newAuthors.map(newAuthor => newAuthor._id);
      query.authors = newAuthorsId;
    }

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = movieReview.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      const coverImageConfig = {
        folder: 'Coders-Tokyo-Forum/posts',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
        transformation: [
          {
            width: 730,
            height: 480,
          },
        ],
      };
      const uploadedCoverImage = await Utils.cloudinary.deleteOldImageAndUploadNewImage(
        data,
        coverImageConfig,
      );
      if (!uploadedCoverImage) {
        throw Boom.badRequest('Edit cover image failed');
      }

      query.cover = {
        public_id: uploadedCoverImage.public_id,
        url: uploadedCoverImage.url,
        secure_url: uploadedCoverImage.secure_url,
      };
    }

    try {
      const upadatedBlog = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $set: query,
        },
        { new: true },
      )
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          { path: 'authors', select: 'name type' },
        ])
        .select('-__v -foodInstance');

      return res.status(200).json({
        status: 200,
        message: 'Edit movie blog review successfully',
        data: upadatedBlog,
      });
    } catch (error) {
      throw Boom.badRequest('Update movie blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};

exports.deleteMovieReview = async (req, res, next) => {
  try {
    const movieReview = await Post.findOne({
      _id: req.params.postId,
      type: 'movie',
    })
      .lean()
      .populate([
        { path: 'tags', select: 'tagName' },
        { path: 'authors', select: 'name type' },
      ]);
    if (!movieReview) {
      throw Boom.notFound('Not found movie blog review');
    }

    const authorsId = movieReview.authors.map(author => author._id);
    const tagsId = movieReview.tags.map(tag => tag._id);

    try {
      await Promise.props({
        isDeletedPost: Post.findByIdAndDelete(req.params.postId),
        isDeletedCoverImage: cloudinary.uploader.destroy(
          movieReview.cover.public_id,
        ),
        isDetetedInOwner: User.findByIdAndUpdate(
          req.user._id,
          {
            $pull: { posts: req.params.postId },
          },
          { new: true },
        ),
        isDeletedInAuthors: Utils.post.deletePostInAuthors(
          movieReview._id,
          authorsId,
        ),
        isDeletedInTags: Utils.post.deletePostInTags(movieReview._id, tagsId),
      });

      return res.status(200).json({
        status: 200,
        message: `Delete movie blog review successfully`,
      });
    } catch (error) {
      throw Boom.badRequest('Delete movie blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};
