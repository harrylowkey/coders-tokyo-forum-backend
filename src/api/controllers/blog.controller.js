const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Tag = require('../models').Tag;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.getOneBlog = async (req, res, next) => {
  try {
    const blog = await Post.findById(req.params.postId)
      .lean()
      .populate({
        path: 'tags',
        select: 'tagName',
      })
      .select('-__v');

    if (!blog) {
      throw Boom.badRequest('Not found blog');
    }

    return res.status(200).json({
      status: 200,
      message: 'success',
      data: blog,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createBlog = async (req, res, next) => {
  const _id = mongoose.Types.ObjectId(); // blogId
  const tags = req.body.tags;
  const coverImage = req.file.path;
  try {
    // create Tag and upload cover image to cloudinary
    const result = await Utils.post.createTagsAndUploadCoverImage(
      _id,
      tags,
      coverImage,
    );

    if (!result) {
      throw Boom.serverUnavailable('Create tag and upload cover image false');
    }

    const tagsId = result.tags.map(tag => ({
      _id: tag.id,
    }));
    const cover = {
      public_id: result.uploadedCoverImage.public_id,
      url: result.uploadedCoverImage.url,
    };

    const isOk = await Promise.props({
      pushBlogIdToOwner: User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { posts: _id },
        },
        { new: true },
      ),
      createNewBlog: Post.create({
        _id,
        userId: req.user._id,
        ...req.body,
        tags: tagsId,
        type: 'Blog',
        cover,
      }),
    });

    if (!isOk.createNewBlog || !isOk.pushBlogIdToOwner) {
      throw Boom.badRequest('Create new blog failed');
    }

    const blog = await Post.findById(isOk.createNewBlog._id)
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .select('-__v');

    return res.status(200).json({
      status: 200,
      message: 'Create new blog successfully',
      data: blog,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editBlog = async (req, res, next) => {
  try {
    const blog = await Post.findById(req.params.postId).lean();
    if (!blog) {
      throw Boom.badRequest('Not found blog, edit blog failed');
    }

    const { topic, description, content, tags } = req.body;
    const file = req.file || {};
    const coverImage = file.path || null;

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        blog._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }

      const newTagsId = newTags.map(newTag => newTag._id);
      query.tags = newTagsId;
    }

    if (coverImage) {
      const newCover = req.file.path;
      const oldCover = blog.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: newCover };
      const uploadedCoverImage = await Utils.cloudinary.deleteAndUploadImage(
        data,
      );
      if (!uploadedCoverImage) {
        throw Boom.badRequest('Edit cover image failed');
      }

      query.cover = {
        public_id: uploadedCoverImage.public_id,
        url: uploadedCoverImage.url,
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
      .select('-__v');

    return res.status(200).json({
      status: 200,
      message: 'Edit blog successfully',
      data: upadatedBlog,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
