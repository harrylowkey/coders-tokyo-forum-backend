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
    const newVideo = {
      userId: user._id,
      ...req.body,
      type,
    };

    // case: gán link video bên ngoài
    let videoTags
    if (isUpload == 'false') {
      if (tags) {
        videoTags = await Utils.post.createTags(tags);
        newVideo.tags = videoTags.map(tag => tag._id);
      }
    }

    // case: user upload video
    if (isUpload == 'true') {
      const video = req.files['video'][0].path;
      let promises = {
        uploadedVideo: cloudinary.uploader.upload(video, videoConfig),
      }

      if (tags) {
        promises.tagsCreated = Utils.post.createTags(tags)
      }
      const result = await Promise.props(promises);

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

      if (result.tagsCreated) {
        videoTags = result.tagsCreated
        newVideo.tags = videoTags.map(tag => tag._id);
      }
      newVideo.media = media;
    }

    let createdNewVideo = await new Post(newVideo).save()
    let dataRes = {
      _id: createdNewVideo._id,
      url: createdNewVideo.url || null,
      topic: createdNewVideo._topic,
      description: createdNewVideo.description,
      content: createdNewVideo.content,
      type: createdNewVideo.type,
      updatedAt: createdNewVideo.updatedAt,
      tags: videoTags || [],
      media: createdNewVideo.media || null
    }
    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
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
    const newAudio = {
      userId: user._id,
      ...req.body,
      type,
    };

    const audio = req.files['audio'][0].path;
    let promises = {
      uploadedVideo: cloudinary.uploader.upload(audio, audioConfig),
    }

    if (tags) {
      promises.tagsCreated = Utils.post.createTags(tags)
    }
    if (authors) {
      promises.authorsCreated = Utils.post.creatAuthors(authors)
    }
    const data = await Promise.props(promises);

    const media = {
      public_id: data.uploadedVideo.public_id,
      url: data.uploadedVideo.url,
      secure_url: data.uploadedVideo.secure_url,
      type: data.uploadedVideo.type,
      signature: data.uploadedVideo.signature,
      width: data.uploadedVideo.width,
      height: data.uploadedVideo.height,
      format: data.uploadedVideo.format,
      resource_type: data.uploadedVideo.resource_type,
      frame_rate: data.uploadedVideo.frame_rate,
      bit_rate: data.uploadedVideo.bit_rate,
      duration: data.uploadedVideo.duration,
    };

    if (data.tagsCreated) newAudio.tags = data.tagsCreated.map(tag => tag._id)
    if (data.authorsCreated) newAudio.authors = data.authorsCreated.map(author => author._id)
    newAudio.media = media;

    const createdNewAudio = await new Post(newAudio).save()
    let dataRes = {
      _id: createdNewAudio._id,
      topic: createdNewAudio._topic,
      description: createdNewAudio.description,
      content: createdNewAudio.content,
      type: createdNewAudio.type,
      updatedAt: createdNewAudio.updatedAt,
      tags: data.tagsCreated || [],
      media: createdNewAudio.media
    }

    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
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
