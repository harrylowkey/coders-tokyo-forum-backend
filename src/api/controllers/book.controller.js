const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig } = require('../../config/vars');

exports.createBookReview = async (req, res, next, type) => {
  const coverImage = req.files['coverImage'][0].path;
  const {
    body: { tags, authors },
    user,
  } = req;

  try {
    const newBook = new Post({
      userId: user._id,
      ...req.body,
      type,
    });

    try {
      const result = await Promise.props({
        tags: Utils.post.createTags(newBook, tags),
        authors: Utils.post.creatAuthors(newBook, authors),
        coverImage: cloudinary.uploader.upload(coverImage, coverImageConfig),
      });

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

      newBook.tags = tagsId;
      newBook.authors = authorsId;
      newBook.cover = cover;
    } catch (error) {
      throw Boom.badRequest(error.message);
    }
    try {
      const isOk = await Promise.props({
        pushBookIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newBook },
          },
          { new: true },
        ),
        createNewBook: newBook.save(),
      });

      const book = await Post.findById(isOk.createNewBook._id)
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          { path: 'authors', select: 'name' },
        ])
        .select('-__v -media -url');

      return res.status(200).json({
        status: 200,
        message: 'Create new book blog review successfully',
        data: book,
      });
    } catch (error) {
      throw Boom.badRequest('Create book blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};

exports.editBookReview = async (req, res, next, type) => {
  const { topic, description, content, tags, authors } = req.body;
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      type,
    }).lean();
    if (!book) {
      throw Boom.notFound('Not found book blog reivew, edit failed');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        book._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }
      query.tags = newTags;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        book._id,
        authors,
      );

      if (!authors) {
        throw Boom.serverUnavailable('Get new authors failed');
      }

      query.authors = newAuthors;
    }

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = book.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      try {
        const uploadedCoverImage = await Utils.cloudinary.deleteOldImageAndUploadNewImage(
          data,
          coverImageConfig,
        );

        query.cover = {
          public_id: uploadedCoverImage.public_id,
          url: uploadedCoverImage.url,
          secure_url: uploadedCoverImage.secure_url,
        };
      } catch (error) {
        throw Boom.badRequest(error.message);
      }
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
          { path: 'authors', select: 'name' },
        ])
        .select('-__v -media -url');

      return res.status(200).json({
        status: 200,
        message: 'Edit book blog review successfully',
        data: upadatedBlog,
      });
    } catch (error) {
      throw Boom.badRequest('Update book blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};

exports.deleteBookReview = async (req, res, next, type) => {
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      type,
    })
      .lean()
      .populate([
        { path: 'tags', select: 'tagName' },
        { path: 'authors', select: 'name' },
      ]);
    if (!book) {
      throw Boom.notFound('Not found book blog review');
    }

    const authorsId = book.authors.map(author => author._id);
    const tagsId = book.tags.map(tag => tag._id);

    try {
      await Promise.props({
        isDeletedPost: Post.findByIdAndDelete(req.params.postId),
        isDeletedCoverImage: cloudinary.uploader.destroy(book.cover.public_id),
        isDetetedInOwner: User.findByIdAndUpdate(
          req.user._id,
          {
            $pull: { posts: req.params.postId },
          },
          { new: true },
        ),
        isDeletedInAuthors: Utils.post.deletePostInAuthors(book._id, authorsId),
        isDeletedInTags: Utils.post.deletePostInTags(book._id, tagsId),
      });

      return res.status(200).json({
        status: 200,
        message: `Delete book successfully`,
      });
    } catch (error) {
      throw Boom.badRequest('Delete book blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};
