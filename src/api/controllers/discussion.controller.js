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
    const newDiscusstion = new Post({
      topic,
      content,
      type,
    });

    const newTags = await Utils.post.createTags(newDiscusstion, tags);
    if (!newTags) {
      throw Boom.serverUnavailable('Create tag failed');
    }
    const tagsId = newTags.map(tag => ({
      _id: tag.id,
    }));
    newDiscusstion.tags = tagsId;

    try {
      const isOk = await Promise.props({
        pushDiscussionIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newDiscusstion },
          },
          { new: true },
        ),
        createNewDiscusstion: newDiscusstion.save(),
      });

      const discussionCreated = await Post.findById(
        isOk.createNewDiscusstion._id,
      )
        .lean()
        .populate({ path: 'tags', select: 'tagName ' })
        .select(' -__v -url -media -authors');

      return res.status(200).json({
        staus: 200,
        message: 'Create new discussion successfully',
        data: discussionCreated,
      });
    } catch (error) {
      throw Boom.badRequest(error.message);
    }
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
