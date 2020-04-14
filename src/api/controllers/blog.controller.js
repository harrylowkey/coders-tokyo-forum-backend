const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models')
const Promise = require('bluebird');
const { CloudinaryService } = require('@services')
const { FILE_REFERENCE_QUEUE } = require('@bull')

exports.createBlog = async (req, res, next) => {
  const type = 'blog'
  const blogCover = req.file
  const {
    body: { tags },
  } = req;
  try {
    const newBlog = new Post({
      userId: req.user._id,
      ...req.body,
      type,
    })

    const promises = {
      blogCover: new File({
        secureURL: blogCover.secure_url,
        publicId: blogCover.public_id,
        fileName: blogCover.originalname,
        sizeBytes: blogCover.bytes,
        userId: req.user._id,
        postId: newBlog._id,
        resourceType: 'image'
      }).save()
    }
    if (tags) {
      promises.blogTags = Utils.post.createTags(tags)
    }

    let result = await Promise.props(promises)

    newBlog.cover = result.blogCover._id;
    if (result.blogTags) newBlog.tags = result.blogTags.map(tag => tag._id)

    let createdBlog = await newBlog.save()
    let dataRes = {
      _id: createdBlog._id,
      topic: createdBlog.topic,
      description: createdBlog.description,
      content: createdBlog.content,
      type: createdBlog.type,
      tags: result.blogTags || [],
      cover: {
        secureURL: result.blogCover.secureURL,
        publicId: result.blogCover.publicId,
        fileName: result.blogCover.fileName,
        createdAt: result.blogCover.createdAt,
        sizeBytes: result.blogCover.sizeBytes
      },
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
  const { topic, description, content, tags } = req.body;
  try {
    const blog = await Post.findOne({
      _id: req.params.postId,
      userId: req.user._id,
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
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        blog,
        tags,
      );
      query.tags = newTags;
    }

    let blogCover = req.file
    if (blogCover) {
      const uploadedCoverImage = await
        CloudinaryService.uploadFileProcess(req.user, blog, blogCover, '_blog_image_cover_');

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
      userId: req.user._id,
      type,
    }).lean()
    .populate({ path: 'cover'})
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
