const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig } = require('../../config/vars');

exports.createBlog = async (req, res, next) => {
  const coverImage = req.files['coverImage'][0].path;
  const {
    body: { tags },
    user,
  } = req;
  try {
    const newBlog = new Post({
      userId: user,
      ...req.body,
      type: 'blog',
    });
    try {
      const result = await Promise.props({
        tags: Utils.post.createTags(newBlog, tags),
        coverImage: cloudinary.uploader.upload(coverImage, coverImageConfig),
      });

      if (!result.tags || !result.coverImage) {
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

      newBlog.tags = tagsId;
      newBlog.cover = cover;
    } catch (error) {
      throw Boom.badRequest(error.message);
    }

    try {
      const isOk = await Promise.props({
        pushBlogIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newBlog },
          },
          { new: true },
        ),
        createNewBlog: newBlog.save(),
      });

      const blog = await Post.findById(isOk.createNewBlog._id)
        .lean()
        .populate({ path: 'tags', select: 'tagName' })
        .select('-__v -media -url -authors');

      return res.status(200).json({
        status: 200,
        message: 'Create new blog successfully',
        data: blog,
      });
    } catch (error) {
      throw Boom.badRequest('Create new blog failed');
    }
  } catch (error) {
    return next(error);
  }
};

exports.editBlog = async (req, res, next) => {
  const { topic, description, content, tags } = req.body;
  try {
    const blog = await Post.findOne({
      _id: req.params.postId,
      type: 'blog',
    }).lean();
    if (!blog) {
      throw Boom.notFound('Not found blog, edit blog failed');
    }

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
        .populate({ path: 'tags', select: 'tagName' })
        .select('-__v -media -url -authors');

      return res.status(200).json({
        status: 200,
        message: 'Edit blog successfully',
        data: upadatedBlog,
      });
    } catch (error) {
      throw Boom.badRequest('Update blog failed');
    }
  } catch (error) {
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
      throw Boom.notFound('Not found blog');
    }

    const tagsId = blog.tags.map(tag => tag._id);

    try {
      await Promise.props({
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

      return res.status(200).json({
        status: 200,
        message: `Delete blog successfully`,
      });
    } catch (error) {
      throw Boom.badRequest('Delete blog failed');
    }
  } catch (error) {
    return next(error);
  }
};
