const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { videoConfig, audioConfig } = require('../../config/vars');

exports.createVideo = async (req, res, next, type, isUpload) => {
  const {
    body: { tags },
    user,
  } = req;

  try {
    const newVideo = new Post({
      userId: user._id,
      ...req.body,
      type,
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
        throw Boom.badRequest(error.message);
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
        .select('-__v -authors');

      return res.status(200).json({
        status: 200,
        message: 'Create new video successfully',
        data: videoCreated,
      });
    } catch (error) {
      console.log(error);
      throw Boom.badRequest('Create video failed');
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.editVideo = async (req, res, next, type, isUpload) => {
  const { topic, description, content, tags, url } = req.body;
  try {
    const video = await Post.findOne({
      _id: req.params.postId,
      type,
    }).lean();
    if (!video) {
      throw Boom.notFound('Not found video, edit video failed');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        video._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }
      query.tags = newTags;
    }

    if (isUpload == 'false') {
      if (url) {
        query.url = url;
        query.media = null;
      }
    }

    if (isUpload == 'true') {
      const files = req.files || {};
      const videoInput = files['video'] || null;
      if (videoInput) {
        const newVideo = videoInput[0].path;
        const oldVideo = video.media || {};
        const oldVideoId = oldVideo.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

        const data = { oldVideoId, newVideo };
        try {
          const uploadedVideo = await Utils.cloudinary.deleteOldVideoAndUploadNewVideo(
            data,
            videoConfig,
          );

          const media = {
            public_id: uploadedVideo.public_id,
            url: uploadedVideo.url,
            secure_url: uploadedVideo.secure_url,
            type: uploadedVideo.type,
            signature: uploadedVideo.signature,
            width: uploadedVideo.width,
            height: uploadedVideo.height,
            format: uploadedVideo.format,
            resource_type: uploadedVideo.resource_type,
            frame_rate: uploadedVideo.frame_rate,
            bit_rate: uploadedVideo.bit_rate,
            duration: uploadedVideo.duration,
          };

          query.media = media;
          query.url = null;
        } catch (error) {
          throw Boom.badRequest(error.message);
        }
      }
    }

    try {
      const updatedVideo = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $set: query,
        },
        { new: true },
      )
        .lean()
        .populate([{ path: 'tags', select: 'tagName' }])
        .select('-__v -authors');

      return res.status(200).json({
        status: 200,
        message: 'Edit video successfully',
        data: updatedVideo,
      });
    } catch (error) {
      console.log(error);
      throw Boom.badRequest('Edit video failed');
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.deleteVideo = async (req, res, next, type) => {
  try {
    const video = await Post.findOne({
      _id: req.params.postId,
      type,
    })
      .lean()
      .populate([{ path: 'tags', select: 'tagName' }]);
    if (!video) {
      throw Boom.notFound('Not found video');
    }

    const tagsId = video.tags.map(tag => tag._id);

    let promiesProps = {
      isDeletedPost: Post.findByIdAndDelete(req.params.postId),
      isDetetedInOwner: User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { posts: req.params.postId },
        },
        { new: true },
      ),
      isDeletedVideo: cloudinary.uploader.destroy(video.media.public_id, {
        resource_type: 'video',
      }),
      isDeletedInTags: Utils.post.deletePostInTags(video._id, tagsId),
    };
    if (!video.url) {
      try {
        promiesProps.isDeletedVideo = cloudinary.uploader.destroy(
          video.media.public_id,
          {
            resource_type: 'video',
          },
        );
      } catch (error) {
        throw Boom.badRequest(error.message);
      }
    }

    try {
      await Promise.props(promiesProps);

      return res.status(200).json({
        status: 200,
        message: `Delete video successfully`,
      });
    } catch (error) {
      throw Boom.badRequest('Delete video failed');
    }
  } catch (error) {
    return next(error);
  }
};

exports.createAudio = async (req, res, next, type) => {
  const {
    body: { tags, authors },
    user,
  } = req;
  try {
    const newAudio = new Post({
      userId: user._id,
      ...req.body,
      type,
    });

    const audio = req.files['audio'][0].path;
    try {
      const result = await Promise.props({
        tags: Utils.post.createTags(newAudio, tags),
        authors: Utils.post.creatAuthors(newAudio, authors),
        uploadedVideo: cloudinary.uploader.upload(audio, audioConfig),
      });

      const tagsId = result.tags.map(tag => ({
        _id: tag.id,
      }));

      const authorsId = result.authors.map(author => ({
        _id: author.id,
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

      newAudio.tags = tagsId;
      newAudio.authors = authorsId;
      newAudio.media = media;
    } catch (error) {
      console.log(error);
      throw Boom.badRequest(error.message);
    }

    try {
      const isOk = await Promise.props({
        pushAudioIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newAudio },
          },
          { new: true },
        ),
        createNewAudio: newAudio.save(),
      });

      const audioCreated = await Post.findById(isOk.createNewAudio._id)
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          { path: 'authors', select: 'name type' },
        ])
        .select('-__v -url');

      return res.status(200).json({
        status: 200,
        message: `Create new ${type} successfully`,
        data: audioCreated,
      });
    } catch (error) {
      console.log(error);
      throw Boom.badRequest(`Create new ${type} failed`);
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.editAudio = async (req, res, next, type) => {
  const { topic, description, content, tags, authors } = req.body;

  try {
    const audio = await Post.findOne({
      _id: req.params.postId,
      type,
    }).lean();
    if (!audio) {
      throw Boom.notFound(`Not found ${type}, edit ${type} failed`);
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        audio._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }
      query.tags = newTags;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        audio._id,
        authors,
      );

      if (!authors) {
        throw Boom.serverUnavailable('Get new authors failed');
      }
      query.authors = newAuthors;
    }

    const files = req.files || {};
    const audioInput = files['audio'] || null;
    if (audioInput) {
      const newAudio = audioInput[0].path;
      const oldAudio = video.media || {};
      const oldAudioId = oldAudio.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldAudioId, newAudio };
      try {
        const uploadedAudio = await Utils.cloudinary.deleteOldVideoAndUploadNewVideo(
          data,
          audioConfig,
        );

        const media = {
          public_id: uploadedAudio.public_id,
          url: uploadedAudio.url,
          secure_url: uploadedAudio.secure_url,
          type: uploadedAudio.type,
          signature: uploadedAudio.signature,
          width: uploadedAudio.width,
          height: uploadedAudio.height,
          format: uploadedAudio.format,
          resource_type: uploadedAudio.resource_type,
          frame_rate: uploadedAudio.frame_rate,
          bit_rate: uploadedAudio.bit_rate,
          duration: uploadedAudio.duration,
        };

        query.media = media;
      } catch (error) {
        throw Boom.badRequest(error.message);
      }
    }

    try {
      const updatedAudio = await Post.findByIdAndUpdate(
        req.params.postId,
        {
          $set: query,
        },
        { new: true },
      )
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          { path: 'authors', select: 'name type' },
        ])
        .select('-__v -url');

      return res.status(200).json({
        status: 200,
        message: `Edit ${type} successfully`,
        data: updatedAudio,
      });
    } catch (error) {
      console.log(error);
      throw Boom.badRequest(`Edit ${type} failed`);
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.deleteAudio = async (req, res, next, type) => {
  try {
    const audio = await Post.findOne({
      _id: req.params.postId,
      type,
    })
      .lean()
      .populate([
        { path: 'tags', select: 'tagName' },
        { path: 'authors', select: 'name type' },
      ]);
    if (!audio) {
      throw Boom.notFound('Not found audio');
    }

    const authorsId = audio.authors.map(author => author._id);
    const tagsId = audio.tags.map(tag => tag._id);

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
        isDeletedInAuthors: Utils.post.deletePostInAuthors(
          audio._id,
          authorsId,
        ),
        isDeletedAudio: cloudinary.uploader.destroy(audio.media.public_id, {
          resource_type: 'video',
        }),
        isDeletedInTags: Utils.post.deletePostInTags(audio._id, tagsId),
      });

      return res.status(200).json({
        status: 200,
        message: `Delete ${type} successfully`,
      });
    } catch (error) {
      throw Boom.badRequest('Delete ${type} failed');
    }
  } catch (error) {
    return next(error);
  }
};
