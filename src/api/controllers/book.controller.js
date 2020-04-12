const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { User, Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig } = require('@configVar');

exports.createBookReview = async (req, res, next, type) => {
  const blogCover = req.files['coverImage'][0];
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
      tagsCreated: Utils.post.createTags(tags)
    }

    let data = await Promise.props(promises)

    const newFile = await new File({
      secureURL: blogCover.secure_url,
      publicId: blogCover.public_id,
      fileName: blogCover.originalname,
      sizeBytes: blogCover.bytes,
      userId: req.user._id,
      postId: newBook._id
    }).save();

    newBook.cover = newFile._id;
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
        secureURL: newFile.secureURL,
        publicId: newFile.publicId,
        fileName: newFile.fileName,
        createdAt: newFile.createdAt,
        sizeBytes: newFile.sizeBytes
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

exports.editBookReview = async (req, res, next, type) => {
  const { topic, description, content, tags, authors } = req.body;
  try {
    const book = await Post.findOne({
      _id: req.params.postId,
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

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = book.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      try {
        const uploadedCoverImage = await CloudinaryService.deleteOldImageAndUploadNewImage(
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
      type,
    }).lean()

    if (!book) {
      throw Boom.badRequest('Not found book blog review');
    }

    let result = await Promise.props({
      isDeletedBookBlog: Post.findByIdAndDelete(req.params.postId),
      isDeletedCoverImage: cloudinary.uploader.destroy(book.cover.public_id),
    });

    if  (!result.isDeletedBookBlog) {
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
