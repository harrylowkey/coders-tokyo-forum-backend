const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig } = require('../../config/vars');

exports.createMovieReview = async (req, res, next, type) => {
  const coverImage = req.files['coverImage'][0].path;
  const {
    body: { tags, authors },
    user,
  } = req;

  try {
    const newMovieReview = {
      userId: user.id,
      ...req.body,
      type,
    };

    let promises = {
      coverImage: cloudinary.uploader.upload(coverImage, coverImageConfig)
    }
    if (tags) {
      promises.tagsCreated = Utils.post.createTags(tags)
    }
    if (authors) {
      promises.authorsCreated = Utils.post.creatAuthors(authors)
    }

    const data = await Promise.props(promises);

    const cover = {
      public_id: data.coverImage.public_id,
      url: data.coverImage.url,
      secure_url: data.coverImage.secure_url,
    };

    newMovieReview.cover = cover;
    if (data.tagsCreated) newMovieReview.tags = data.tagsCreated.map(tag => tag._id)
    if (data.authorsCreated) newMovieReview.authors = data.authorsCreated.map(author => author._id)


    const createdMovieReview = await new Post(newMovieReview).save()
    let dataRes = {
      _id: createdMovieReview.id,
      tags: data.tagsCreated || [],
      authors: data.authorsCreated || [],
      url: createdMovieReview.url,
      topic: createdMovieReview.topic,
      description: createdMovieReview.description,
      content: createdMovieReview.content,
      type: createdMovieReview.type,
      cover: createdMovieReview.cover,
      createdAt: createdMovieReview.createdAt
    }

    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.editMovieReview = async (req, res, next, type) => {
  const { topic, description, content, tags, authors, url } = req.body;
  try {
    const movieReview = await Post.findOne({
      _id: req.params.postId,
      type,
    })
      .lean()
      .populate({ path: 'tags', select: '_id tagName' })
      .populate({ path: 'authors', select: '_id name type' });
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
        movieReview,
        tags,
      );

      query.tags = newTags;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        movieReview,
        authors,
      );

      query.authors = newAuthors;
    }

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = movieReview.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      try {
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
        { path: 'authors', select: 'name type' },
      ])
      .select('-__v -media');

    return res.status(200).json({
      status: 200,
      data: upadatedBlog,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.deleteMovieReview = async (req, res, next, type) => {
  try {
    const movieReview = await Post.findOne({
      _id: req.params.postId,
      type,
    }).lean()

    if (!movieReview) {
      throw Boom.badRequest('Not found movie blog review');
    }

    let result = await Promise.props({
      isDeletedMovie: Post.findByIdAndDelete(req.params.postId),
      isDeletedCoverImage: cloudinary.uploader.destroy(
        movieReview.cover.public_id,
      )
    });

    if (!resul.isDeletedMovie) {
      throw Boom.badRequest('Delete movie failed')
    }

    return res.status(200).json({
      status: 200,
      message: `Delete movie blog review successfully`,
    });
  } catch (error) {
    return next(error);
  }
};
