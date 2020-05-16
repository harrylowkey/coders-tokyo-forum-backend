const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { videoConfig, audioConfig } = require('@configVar');
const { CloudinaryService } = require('@services')
const { FILE_REFERENCE_QUEUE } = require('@bull')

exports.createVideo = async (req, res, next, type, isUpload) => {
  const {
    body: { tags },
    user,
  } = req;
  try {
    const newVideo = new Post({
      user: user._id,
      ...req.body,
      type,
    });

    // case: gán link video bên ngoài
    let videoTags
    if (isUpload == 'false') {
      if (tags) {
        videoTags = await Utils.post.createTags(tags);
        newVideo.tags = videoTags.map(tag => tag._id);
      }
    }

    // case: user upload video
    let newMedia
    if (isUpload == 'true') {
      const video = req.file
      let promises = {
        uploadedVideo: CloudinaryService.uploadMediaProcess(req.user, newVideo, video, '_video_', videoConfig)
      }

      if (tags) {
        promises.tagsCreated = Utils.post.createTags(tags)
      }
      const result = await Promise.props(promises)
      if (result.tagsCreated) {
        newVideo.tags = result.tagsCreated.map(tag => tag._id);
      }

      newMedia = result.uploadedVideo
      newVideo.media = result.uploadedVideo._id;
    }

    let createdNewVideo = await newVideo.save()
    let dataRes = {
      _id: createdNewVideo._id,
      url: createdNewVideo.url || null,
      topic: createdNewVideo._topic,
      description: createdNewVideo.description,
      content: createdNewVideo.content,
      type: createdNewVideo.type,
      updatedAt: createdNewVideo.updatedAt,
      tags: videoTags || [],
      media: newMedia || null
    }
    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editVideo = async (req, res, next, type, isUpload) => {
  const { topic, description, content, tags, url } = req.body;
  try {
    const video = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type
    })
      .lean()
      .populate({ path: 'tags', select: '_id tagName' })
      .populate({ path: 'media', select: 'secureURL publicId fileName' })
    if (!video) {
      throw Boom.badRequest('Not found video, edit video failed');
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        video,
        tags,
      );
      query.tags = newTags;
    }

    if (isUpload == 'false') {
      if (url) {
        query.url = url;
        query.media = null;
      }
    }

    if (isUpload == 'true') {
      const newVideo = req.file
      if (newVideo) {
        const uploadedVideo = await
          CloudinaryService.uploadMediaProcess(req.user, video, newVideo, '_video_', videoConfig);

        query.media = uploadedVideo._id;
        query.url = null;
      }
    }

    const updatedVideo = await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: query,
      },
      { new: true },
    )
      .lean()
      .populate([{ path: 'tags', select: 'tagName' }])
      .populate({
        path: 'media',
        select: '-__v'
      })
      .select('-__v -authors')

    return res.status(200).json({
      status: 200,
      data: updatedVideo,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteVideo = async (req, res, next, type) => {
  try {
    const video = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    })
      .lean()
      .populate({ path: 'media' })

    if (!video) {
      throw Boom.badRequest('Not found video');
    }

    if (!video.url) {
      FILE_REFERENCE_QUEUE.deleteFile.add({ file: video.media })
    }
    const isDeleted = await Post.findByIdAndDelete(video._id)
    if (!isDeleted) {
      throw Boom.badRequest('Delete video failed')
    }

    return res.status(200).json({
      status: 200,
      message: `Delete video successfully`,
    });

  } catch (error) {
    return next(error);
  }
};

exports.createAudio = async (req, res, next) => {
  const {
    body: { tags, authors, audio, cover, type },
    user,
  } = req;
  try {
    const newAudio = new Post({
      user: user._id,
      ...req.body,
      type: type.slice(0, type.length - 1),
    });

    let blogTags = []
    if (tags) blogTags = await Utils.post.createTags(tags)

    let authorsCreated = await Utils.post.creatAuthors(authors)

    newAudio.cover = cover._id;
    if (blogTags.length) newAudio.tags = blogTags.map(tag => tag._id)

    newAudio.authors = authorsCreated.map(author => author._id)
    newAudio.media = req.body.audio

    const promises = [
      newAudio.save(),
      File.findByIdAndUpdate(
        cover._id,
        {
          $set: { postId: newAudio._id }
        },
        { new: true }
      ),
      File.findByIdAndUpdate(
        audio._id,
        {
          $set: { postId: newAudio._id }
        },
        { new: true }
      )
    ]

    const [createdNewAudio] = await Promise.all(promises)
    let dataRes = {
      _id: createdNewAudio._id,
      topic: createdNewAudio._topic,
      description: createdNewAudio.description,
      content: createdNewAudio.content,
      type: createdNewAudio.type,
      updatedAt: createdNewAudio.updatedAt,
      authors: authorsCreated,
      tags: blogTags,
      media: req.body.audio,
    }

    return res.status(200).json({
      status: 200,
      data: dataRes,
    });
  } catch (error) {
    return next(error);
  }
};

exports.editAudio = async (req, res, next) => {
  const { topic, description, content, tags, authors, cover, type } = req.body;
  try {
    const audio = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type: type.slice(0, type.length - 1),
    })
      .lean()
      .populate({ path: 'tags', select: '_id tagName' })
      .populate({ path: 'authors', select: '_id name type' })
      .populate({ path: 'media', select: 'secureURL publicId fileName' })
    if (!audio) {
      throw Boom.badRequest(`Not found ${type}, edit ${type} failed`);
    }

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        audio,
        tags,
      );

      query.tags = newTags;
    }

    if (authors) {
      const newAuthors = await Utils.post.removeOldAuthorsAndCreateNewAuthors(
        audio,
        authors,
      );

      query.authors = newAuthors;
    }

    if (cover) query.cover = req.body.cover._id
    if (audio) query.media = req.body.audio._id

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
        { path: 'media' }
      ])
      .select('-__v -url');

    return res.status(200).json({
      status: 200,
      data: updatedAudio,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.deleteAudio = async (req, res, next, type) => {
  try {
    const audio = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    })
      .lean()
      .populate({ path: 'media' })

    if (!audio) {
      throw Boom.badRequest('Not found audio');
    }

    FILE_REFERENCE_QUEUE.deleteFile.add({ file: audio.media })
    const isDeleted = await Post.findByIdAndDelete(audio._id)

    if (!isDeleted) {
      throw Boom.badRequest(`Delete ${type} failed`)
    }

    return res.status(200).json({
      status: 200,
      message: `Delete ${type} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};
