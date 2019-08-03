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
