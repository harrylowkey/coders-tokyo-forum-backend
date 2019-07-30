const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
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
      throw Boom.badRequest(`Not found blog`);
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
  const { tags } = req.body;
  const coverImage = req.files['coverImage'][0].path;
  try {
    const result = await Promise.props({
      tags: Utils.post.createTags(_id, tags),
      coverImage: Utils.cloudinary.uploadCoverImage(coverImage),
    });

    if (!result) {
      throw Boom.serverUnavailable('Create tag and upload cover image false');
    }

    const tagsId = result.tags.map(tag => ({
      _id: tag.id,
    }));

    const cover = {
      public_id: result.coverImage.public_id,
      url: result.coverImage.url,
      secure_url: result.coverImage.secure_url,
    };

    const blogData = {
      _id,
      userId: req.user._id,
      ...req.body,
      tags: tagsId,
      type: 'blog',
      cover,
    };

    const isOk = await Promise.props({
      pushBlogIdToOwner: User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { posts: _id },
        },
        { new: true },
      ),
      createNewBlog: Post.create(blogData),
    });

    if (!isOk.createNewBlog || !isOk.pushBlogIdToOwner) {
      throw Boom.badRequest('Create new blog failed');
    }

    const blog = await Post.findById(isOk.createNewBlog._id)
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .select('-__v -authors -mediaInstance -foodInstance');

    return res.status(200).json({
      status: 200,
      message: 'Create new blog successfully',
      data: blog,
    });
  } catch (error) {
    console.log(error)
    return next(error);
  }
};

exports.editBlog = async (req, res, next) => {
  try {
    const blog = await Post.findOne({
      _id: req.params.postId,
      type: 'blog',
    }).lean();
    if (!blog) {
      throw Boom.badRequest('Not found blog, edit blog failed');
    }

    const { topic, description, content, tags } = req.body;

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

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = blog.cover || {};
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

    const upadatedBlog = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: query,
      },
      { new: true },
    )
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .select('-__v -foodInstance -mediaInstance -authors');

    return res.status(200).json({
      status: 200,
      message: 'Edit blog successfully',
      data: upadatedBlog,
    });
  } catch (error) {
    console.log(error)
    return next(error);
  }
};

exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Post.findOne({
      _id: req.params.postId,
      type: 'blog',
    })
      .populate({ path: 'tags', select: 'tagName' })
      .lean();
    if (!blog) {
      throw Boom.badRequest('Not found blog');
    }

    const tagsId = blog.tags.map(tag => tag._id);
    const result = await Promise.props({
      isDeletedPost: Post.findByIdAndDelete(req.params.postId),
      isDeletedCoverImage: cloudinary.uploader.destroy(blog.cover.public_id),
      isDetetedInOwner: User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { posts: req.params.postId },
        },
        { new: true },
      ),
      isDeletedInTags: Utils.post.deletePostInTags(blog._id, tagsId),
    });

    if (
      !result.isDeletedPost ||
      !result.isDetetedInOwner ||
      result.isDeletedCoverImage.result !== 'ok' ||
      !result.isDeletedInTags
    ) {
      throw Boom.badRequest(`Delete blog failed`);
    }

    return res.status(200).json({
      status: 200,
      message: `Delete blog successfully`,
    });
  } catch (error) {
    return next(error);
  }
};
