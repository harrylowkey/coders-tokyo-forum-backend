const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { FILE_REFERENCE_QUEUE } = require('@bull')

exports.createBookReview = async (req, res, next) => {
  const type = 'book'
  const blogCover = req.file;
  req.body = JSON.parse(JSON.stringify(req.body))
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

    let promises = {
      authorsCreated: Utils.post.creatAuthors(authors),
      blogCover: new File({
        secureURL: blogCover.secure_url,
        publicId: blogCover.public_id,
        fileName: blogCover.originalname,
        sizeBytes: blogCover.bytes,
        userId: req.user._id,
        postId: newBook._id
      }).save()
    }
    if (tags) promises.tagsCreated = Utils.post.createTags(tags)

    let data = await Promise.props(promises)

    newBook.cover = data.blogCover._id;
    if (data.tagsCreated) newBook.tags = data.tagsCreated.map(tag => tag._id)
    if (data.authorsCreated) newBook.authors = data.authorsCreated.map(author => author._id)

    const createdBook = await newBook.save()
    const dataRes = {
      _id: createdBook._id,
      topic: createdBook.topic,
      description: createdBook.description,
      content: createdBook.content,
      type: createdBook.type,
      cover: {
        secureURL: data.blogCover.secureURL,
        publicId: data.blogCover.publicId,
        fileName: data.blogCover.fileName,
        createdAt: data.blogCover.createdAt,
        sizeBytes: data.blogCover.sizeBytes
      },
      authors: data.authorsCreated || [],
      tags: data.tagsCreated || [],
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
  const { topic, description, content, tags, authors } = req.body;
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
      userId: req.user._id,
      type,
    })
      .lean()
      .populate({ path: 'tags', select: '_id tagName' })
      .populate({ path: 'authors', select: '_id name type' });

    if (!book) {
      throw Boom.badRequest('Not found book blog reivew, edit failed');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        book,
        tags,
      );
      query.tags = newTags;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        book,
        authors,
      );
      query.authors = newAuthors;
    }

    let blogCover = req.file
    if (blogCover) {
      const uploadedCoverImage = await
        CloudinaryService.uploadFileProcess(req.user, book, blogCover, '_book_blog_review_cover_');

      query.cover = uploadedCoverImage._id
    }

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
      userId: req.user._id,
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
