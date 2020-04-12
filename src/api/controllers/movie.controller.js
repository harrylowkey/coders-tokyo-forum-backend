const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig } = require('@configVar');

exports.createMovieReview = async (req, res, next) => {
  const type = 'movie'
  const blogCover = req.file
  const {
    body: { tags, authors },
    user,
  } = req;

  try {
    const newMovieReview = new Post({
      userId: user.id,
      ...req.body,
      type,
    });

    let promises = {
      blogCover: new File({
        secureURL: blogCover.secure_url,
        publicId: blogCover.public_id,
        fileName: blogCover.originalname,
        sizeBytes: blogCover.bytes,
        userId: req.user._id,
        postId: newMovieReview._id
      }).save(),
      authorsCreated: Utils.post.creatAuthors(authors)
    }
    if (tags) {
      promises.tagsCreated = Utils.post.createTags(tags)
    }

    const data = await Promise.props(promises);

    newMovieReview.cover = data.blogCover._id;
    if (data.tagsCreated) newMovieReview.tags = data.tagsCreated.map(tag => tag._id)
    if (data.authorsCreated) newMovieReview.authors = data.authorsCreated.map(author => author._id)


    const createdMovieReview = await newMovieReview.save()
    let dataRes = {
      _id: createdMovieReview.id,
      tags: data.tagsCreated || [],
      authors: data.authorsCreated || [],
      url: createdMovieReview.url,
      topic: createdMovieReview.topic,
      description: createdMovieReview.description,
      content: createdMovieReview.content,
      type: createdMovieReview.type,
      cover: { 
        secureURL: data.blogCover.secureURL,
        publicId: data.blogCover.publicId,
        fileName: data.blogCover.fileName,
        createdAt: data.blogCover.createdAt,
        sizeBytes: data.blogCover.sizeBytes
      },
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
        const uploadedCoverImage = await CloudinaryService.deleteOldImageAndUploadNewImage(
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
