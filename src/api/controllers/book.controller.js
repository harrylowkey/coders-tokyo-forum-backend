const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.getOneBookReview = async (req, res, next) => {
  try {
    const bookReivew = await Post.findById(req.params.postId)
      .lean()
      .populate({
        path: 'tags',
        select: 'tagName',
      })
      .populate({
        path: 'authors',
        select: 'name',
      })
      .select('-__v');

    if (!bookReivew) {
      throw Boom.badRequest(`Not found blog book reivew`);
    }

    return res.status(200).json({
      status: 200,
      message: 'success',
      data: bookReivew,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createBookReview = async (req, res, next) => {
  const _id = mongoose.Types.ObjectId(); // blogId
  const { tags, authors } = req.body;
  const coverImage = req.files['coverImage'][0].path;
  try {
    const result = await Promise.props({
      tags: Utils.post.createTags(_id, tags),
      authors: Utils.post.creatAuthors(_id, authors),
      coverImage: Utils.cloudinary.uploadCoverImage(coverImage),
    });

    if (!result.tags || !result.authors || !result.coverImage) {
      throw Boom.serverUnavailable('Create tag and upload cover image false');
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

    const bookData = {
      _id,
      userId: req.user._id,
      ...req.body,
      tags: tagsId,
      authors: authorsId,
      type: 'book',
      cover,
    };

    const isOk = await Promise.props({
      pushBookIdToOwner: User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { posts: _id },
        },
        { new: true },
      ),
      createNewBook: Post.create(bookData),
    });

    if (!isOk.createNewBook || !isOk.pushBookIdToOwner) {
      throw Boom.badRequest('Create new book failed');
    }

    const book = await Post.findById(isOk.createNewBook._id)
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .populate({ path: 'authors', select: 'name' })
      .select('-__v -mediaInstance -foodInstance -mediaInstance');

    return res.status(200).json({
      status: 200,
      message: 'Create new book successfully',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editBookReview = async (req, res, next) => {
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      type: 'book',
    }).lean();
    if (!book) {
      throw Boom.badRequest('Not found book, edit book failed');
    }

    const { topic, description, content, tags, authors } = req.body;
    const file = req.file || {};
    const coverImage = file.path || null;

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

      const newTagsId = newTags.map(newTag => newTag._id);
      query.tags = newTagsId;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        book._id,
        authors,
      );

      if (!authors) {
        throw Boom.serverUnavailable('Get new authors failed');
      }

      const newAuthorsId = newAuthors.map(newAuthor => newAuthor._id);
      query.authors = newAuthorsId;
    }

    if (coverImage) {
      const newCover = req.file.path;
      const oldCover = book.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: newCover };
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

    const upadatedBlog = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: query,
      },
      { new: true },
    )
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .populate({ path: 'authors', select: 'name' })
      .select('-__v -foodInstance -mediaInstance');

    return res.status(200).json({
      status: 200,
      message: 'Edit book successfully',
      data: upadatedBlog,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.deleteBookReview = async (req, res, next) => {
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      type: 'book',
    })
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .populate({ path: 'authors', select: 'name' });
    if (!book) {
      throw Boom.badRequest('Not found blog book review');
    }

    const authorsId = book.authors.map(author => author._id);
    const tagsId = book.tags.map(tag => tag._id);
    const result = await Promise.props({
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
    console.log(result.isDeletedCoverImage)
    if (
      !result.isDeletedPost ||
      !result.isDetetedInOwner ||
      result.isDeletedCoverImage.result !== 'ok' ||
      !result.isDeletedInAuthors ||
      !result.isDeletedInTags
    ) {
      throw Boom.badRequest(`Delete book failed`);
    }

    return res.status(200).json({
      status: 200,
      message: `Delete book successfully`,
    });
  } catch (error) {
    return next(error);
  }
};
