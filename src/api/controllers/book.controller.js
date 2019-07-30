const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');

exports.createBookReview = async (req, res, next) => {
  const _id = mongoose.Types.ObjectId(); // blogId
  const { tags, authors } = req.body;
  const coverImage = req.file.path;
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
      type: 'Book',
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
      .select('-__v');

    return res.status(200).json({
      status: 200,
      message: 'Create new book successfully',
      data: book,
    });
  } catch (error) {
    return next(error);
  }
};
