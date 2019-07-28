const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const httpStatus = require('http-status');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Author = require('../models').Author;
const Food = require('../models').Food;
const Tag = require('../models').Tag;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createBlog = async (req, res, next) => {
  const tags = req.body.tags;
  const _id = mongoose.Types.ObjectId();
  try {
    const getTagPromise = (tagName, postId) => {
      return new Promise(async (resolve, reject) => {
        const isExistedTag = await Tag.findOne({ tagName }).lean();
        try {
          if (isExistedTag) {
            const updatedTag = Tag.findOneAndUpdate(
              { tagName },
              {
                $push: { posts: postId },
              },
              { new: true },
            );
            return resolve(updatedTag);
          }

          const newTag = Tag.create({
            _id: mongoose.Types.ObjectId(),
            tagName,
            posts: [postId],
          });
          return resolve(newTag);
        } catch (error) {
          return reject(error);
        }
      });
    };
    const newTagsArrPromise = tags.map(tag => getTagPromise(tag, _id));
    const result = await Promise.props({
      newTags: Promise.all(newTagsArrPromise),
      uploadedCoverImage: cloudinary.uploader.upload(req.file.path, {
        transformation: [
          {
            width: 730,
            height: 480,
          },
        ],
      }),
    });

    const tagsId = result.newTags.map(newTag => ({
      _id: newTag.id,
    }));
    const cover = {
      public_id: result.uploadedCoverImage.public_id,
      url: result.uploadedCoverImage.url,
    };
    const newBlog = await Post.create({
      _id,
      userId: req.user._id,
      ...req.body,
      tags: tagsId,
      type: 'Blog',
      cover,
    });
    if (!newBlog) {
      throw Boom.badRequest('Create new blog failed');
    }
    const blog = await Post.findById(newBlog._id)
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
  const { topic, description, content, tags } = req.body;
  const coverImage = req.file.path;

  let query = {};
  if (topic) query.topic = topic;
  if (description) query.description = description;
  if (content) query.content = content;
  if (tags) {
    const getTagPromise = (tagName, postId) => {
      return new Promise(async (resolve, reject) => {
        const existedTag = await Tag.findOne({ tagName }).lean();
        try {
          if (existedTag) {
            return resolve(existedTag);
          }

          const newTag = Tag.create({
            _id: mongoose.Types.ObjectId(),
            tagName,
            posts: [postId],
          });
          return resolve(newTag);
        } catch (error) {
          return reject(error);
        }
      });
    };
    const newTagsArrPromise = tags.map(tag => getTagPromise(tag, _id));
    const newTags = await Promise.all(newTagsArrPromise);
    const newTagsId = newTags.map(newTag => newTag._id);

    query.tags = newTagsId;
  }

  if (coverImage) {
    
  }
};
