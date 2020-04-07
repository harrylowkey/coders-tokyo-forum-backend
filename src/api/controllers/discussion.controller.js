const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');

exports.createDiscussion = async (req, res, next, type) => {
  const {
    body: { topic, tags, content },
    user,
  } = req;

  try {
    let discussion = {
      userId: user._id,
      topic,
      content,
      type,
    };

    let discussionTags
    if (tags) {
      discussionTags = await Utils.post.createTags(tags)
      discussion.tags = discussionTags.map(tag => tag._id)
    }
    let createdDissucsion = await new Post(discussion).save()
    let resData = {
      _id: createdDissucsion._id,
      tags: discussionTags || [],
      topic,
      content,
      type,
      createdAt: createdDissucsion.createdAt
    }
    return res.status(200).json({
      staus: 200,
      data: resData,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editDiscussion = async (req, res, next, type) => {
  const { topic, content, tags } = req.body;

  try {
    const discussion = await Post.findById({
      _id: req.params.postId,
      type,
    })
      .lean()
      .populate({ path: 'tags', select: 'tagName ' });

    if (!discussion) {
      throw Boom.notFound('Not found discussion, edit discussion failed');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        discussion._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }
      query.tags = newTags;
    }

    try {
      const updatedDiscussion = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $set: query,
        },
        { new: true },
      )
        .lean()
        .populate({ path: 'tags', select: 'tagName ' })
        .select(' -__v -url -media -authors');

      return res.status(200).json({
        status: 200,
        message: 'Edit discussion failed',
        data: updatedDiscussion,
      });
    } catch (error) {
      throw Boom.badRequest(error.message);
    }
  } catch (error) {
    return next(error);
  }
};

exports.deleteDiscussion = async (req, res, next, type) => {
  try {
    const discussion = await Post.findOne({
      _id: req.params.postId,
      type,
    })
      .lean()
      .populate([{ path: 'tags', select: 'tagName' }]);
    if (!discussion) {
      throw Boom.notFound('Not found discussion');
    }

    const tagsId = discussion.tags.map(tag => tag._id);
    try {
      await Promise.props({
        isDeletedPost: Post.findByIdAndDelete(req.params.postId),
        isDetetedInOwner: User.findByIdAndUpdate(
          req.user._id,
          {
            $pull: { posts: req.params.postId },
          },
          { new: true },
        ),
        isDeletedInTags: Utils.post.deletePostInTags(discussion._id, tagsId),
      });

      return res.status(200).json({
        status: 200,
        message: `Delete discussion successfully`,
      });
    } catch (error) {
      throw Boom.badRequest(error.message);
    }
  } catch (error) {
    return next(error);
  }
};
