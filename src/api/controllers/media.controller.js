const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createVideo = async (req, res, next, isUpload) => {
  const {
    body: { tags },
    user,
  } = req;

  try {
    const newVideo = new Post({
      userId: user._id,
      ...req.body,
      type: 'video',
    });

    // case: gán link video bên ngoài
    if (isUpload == 'false') {
      const newTags = await Utils.post.createTags(newVideo, tags);
      if (!newTags) {
        throw Boom.serverUnavailable('Create tag failed');
      }
      const tagsId = newTags.map(tag => ({
        _id: tag.id,
      }));

      newVideo.tags = tagsId;
    }

    // case: user upload video
    if (isUpload == 'true') {
      const video = req.files['video'][0].path;
      const videoConfig = {
        folder: 'Coders-Tokyo-Forum/posts/media',
        use_filename: true,
        unique_filename: true,
        resource_type: 'video',
        chunk_size: 10000000, // 10mb
      };

      try {
        const result = await Promise.props({
          tags: Utils.post.createTags(newVideo, tags),
          uploadedVideo: cloudinary.uploader.upload(video, videoConfig),
        });

        const tagsId = result.tags.map(tag => ({
          _id: tag.id,
        }));

        const media = {
          public_id: result.uploadedVideo.public_id,
          url: result.uploadedVideo.url,
          secure_url: result.uploadedVideo.secure_url,
          type: result.uploadedVideo.type,
          signature: result.uploadedVideo.signature,
          width: result.uploadedVideo.width,
          height: result.uploadedVideo.height,
          format: result.uploadedVideo.format,
          resource_type: result.uploadedVideo.resource_type,
          frame_rate: result.uploadedVideo.frame_rate,
          bit_rate: result.uploadedVideo.bit_rate,
          duration: result.uploadedVideo.duration,
        };

        newVideo.tags = tagsId;
        newVideo.media = media;
      } catch (error) {
        throw Boom.serverUnavailable('Upload video failed');
      }
    }

    try {
      const isOk = await Promise.props({
        pushVideoIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newVideo },
          },
          { new: true },
        ),
        createNewVideo: newVideo.save(),
      });

      const videoCreated = await Post.findById(isOk.createNewVideo._id)
        .lean()
        .populate([{ path: 'tags', select: 'tagName' }])
        .select('-__v -authors -foodInstance');

      return res.status(200).json({
        status: 200,
        message: 'Create new video successfully',
        data: videoCreated,
      });
    } catch (error) {
      throw Boom.badRequest('Create video failed');
    }
  } catch (error) {
    return next(error);
  }
};
