const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { FILE_REFERENCE_QUEUE } = require('@bull')

exports.createBookReview = async (req, res, next) => {
  const type = 'book'
  req.body = JSON.parse(JSON.stringify(req.body))
  const {
    body: { tags, authors, book, cover },
    user,
  } = req;

  try {
    const newBook = new Post({
      user: user._id,
      ...req.body,
      type,
    });

    let blogTags = []
    if (tags) blogTags = await Utils.post.createTags(tags)

    let authorsCreated = await Utils.post.creatAuthors(authors)

    newBook.cover = req.body.cover._id;
    if (blogTags.length) newBook.tags = blogTags.map(tag => tag._id)
    newBook.authors = authorsCreated.map(author => author._id)
    newBook.book = book

    const promises = [
      newBook.save(),
      File.findByIdAndUpdate(
        cover._id,
        {
          $set: { postId: newBook._id }
        },
        { new: true }
      )
    ]

    const [createdBook, _] = await Promise.all(promises)
    const dataRes = {
      _id: createdBook._id,
      topic: createdBook.topic,
      description: createdBook.description,
      content: createdBook.content,
      type: createdBook.type,
      cover: req.body.cover,
      authors: authorsCreated,
      tags: blogTags,
      book,
      createdAt: createdBook.createdAt
    }
    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editBookReview = async (req, res, next) => {
  const type = 'book'
  const { topic, description, content, tags, authors, book } = req.body;
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    })
      .lean()
      .populate({ path: 'tags', select: '_id tagName' })
      .populate({ path: 'authors', select: '_id name type' });

    if (!book) {
      throw Boom.badRequest('Not found book blog reivew, edit failed');
    }

    let query = { book };
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        book,
        tags,
      );
      query.tags = newTags;

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        book,
        authors,
      );
      query.authors = newAuthors;
    }

    if (cover) query.cover = req.body.cover._id

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
      .populate({ path: 'cover', select: 'publicId sercureURL fileName sizeBytes' })
      .select('-__v -media -url');

    return res.status(200).json({
      status: 200,
      data: upadatedBlog,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteBookReview = async (req, res, next, type) => {
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    })
      .lean()
      .populate({ path: 'cover' })

    if (!book) {
      throw Boom.badRequest('Not found book blog review');
    }

    FILE_REFERENCE_QUEUE.deleteFile.add({ file: book.cover })
    const isDeleted = await Post.findByIdAndDelete(req.params.postId)

    if (!isDeleted) {
      throw Boom.badRequest('Delete book blog failed')
    }

    return res.status(200).json({
      status: 200,
      message: `Delete book blog successfully`,
    });
  } catch (error) {
    return next(error);
  }
};
