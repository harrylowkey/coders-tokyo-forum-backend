const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models')
const Promise = require('bluebird');
const { CloudinaryService } = require('@services')
const { FILE_REFERENCE_QUEUE } = require('@bull')

exports.createBlog = async (req, res, next) => {
  const type = 'blog'
  const {
    body: { tags, cover },
  } = req;
  try {
    const newBlog = new Post({
      user: req.user._id,
      ...req.body,
      type,
    })

    let blogTags = []
    if (tags) blogTags = await Utils.post.createTags(tags)

    newBlog.cover = req.body.cover._id
    if (blogTags.length) newBlog.tags = blogTags.map(tag => tag._id)

    const promises = [
      newBlog.save(),
      File.findByIdAndUpdate(
        cover._id,
        {
          $set: { postId: newBlog._id }
        },
        { new: true }
      )
    ]

    const [createdBlog, _] = await Promise.all(promises)

    let dataRes = {
      _id: createdBlog._id,
      topic: createdBlog.topic,
      description: createdBlog.description,
      content: createdBlog.content,
      type: createdBlog.type,
      tags: blogTags,
      cover: req.body.cover,
      createdAt: createdBlog.createdAt,
    }
    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editBlog = async (req, res, next) => {
  const type = 'blog'
  const { topic, description, content, tags, cover } = req.body;
  try {
    const blog = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    })
      .lean()
      .populate({
        path: 'tags',
        select: '_id tagName'
      })

    if (!blog) {
      throw Boom.badRequest('Not found blog');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (cover) query.cover = req.body.cover._id
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        blog,
        tags,
      );
      query.tags = newTags;
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
      .populate({ path: 'cover', select: 'publicId sercureURL fileName sizeBytes'})
      .select('-__v -media -url -authors');

    return res.status(200).json({
      status: 200,
      data: upadatedBlog,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteBlog = async (req, res, next, type) => {
  try {
    const blog = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    }).lean()
      .populate({ path: 'cover' })
    if (!blog) {
      throw Boom.badRequest('Not found blog');
    }

    FILE_REFERENCE_QUEUE.deleteFile.add({ file: blog.cover })
    const isDeleted = await Post.findByIdAndDelete(req.params.postId)

    if (!isDeleted) {
      throw Boom.badRequest('Delete blog failed')
    }

    return res.status(200).json({
      status: 200,
      message: `Delete blog successfully`,
    });
  } catch (error) {
    return next(error);
  }
};
