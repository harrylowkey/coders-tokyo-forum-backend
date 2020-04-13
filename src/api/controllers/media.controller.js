const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { videoConfig, audioConfig } = require('@configVar');
const { CloudinaryService } = require('@services')

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
        uploadedVideo: cloudinary.uploader.upload(video.path, videoConfig),
      }

      if (tags) {
        promises.tagsCreated = Utils.post.createTags(tags)
      }
      const result = await Promise.props(promises);
      const media = await new File({
        secureURL: result.uploadedVideo.secure_url,
        publicId: result.uploadedVideo.public_id,
        fileName: result.uploadedVideo.originalname,
        sizeBytes: result.uploadedVideo.bytes,
        userId: req.user._id,
        postId: newVideo._id,
        media: {
          type: result.uploadedVideo.type,
          signature: result.uploadedVideo.signature,
          width: result.uploadedVideo.width,
          height: result.uploadedVideo.height,
          format: result.uploadedVideo.format,
          resource_type: result.uploadedVideo.resource_type,
          frame_rate: result.uploadedVideo.frame_rate,
          bit_rate: result.uploadedVideo.bit_rate,
          duration: result.uploadedVideo.duration,
        }
      }).save()
      if (result.tagsCreated) {
        videoTags = result.tagsCreated
        newVideo.tags = videoTags.map(tag => tag._id);
      }
      newMedia = media
      newVideo.media = media;
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
    console.log(error);
    return next(error);
  }
};

exports.editVideo = async (req, res, next, type, isUpload) => {
  const { topic, description, content, tags, url } = req.body;
  try {
    const video = await Post.findOne({
      _id: req.params.postId,
      userId: req.user._id,
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
          CloudinaryService.uploadMediaProcess(req.user, video, newVideo.path, '_video_', videoConfig);

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
    if (!video) {
      throw Boom.badRequest('Not found video');
    }

    let promiesProps = {
      isDeletedVideo: Post.findByIdAndDelete(video_id),
    };
    if (!video.url) {
      promiesProps.isDeletedVideo = cloudinary.uploader.destroy(
        video.media.public_id,
        { resource_type: 'video' }
      );
    }

    let result = await Promise.props(promiesProps);
    if (result.isDeletedVideo) {
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

    const audio = req.file
    let promises = {
      uploadedVideo: cloudinary.uploader.upload(audio.path, audioConfig),
      authorsCreated: Utils.post.creatAuthors(authors)
    }
    if (tags) {
      promises.tagsCreated = Utils.post.createTags(tags)
    }

    const data = await Promise.props(promises);

    const media = await new File({
      secureURL: data.uploadedVideo.secure_url,
      publicId: data.uploadedVideo.public_id,
      fileName: data.uploadedVideo.originalname,
      sizeBytes: data.uploadedVideo.bytes,
      userId: req.user._id,
      postId: newAudio._id,
      media: {
        type: data.uploadedVideo.type,
        signature: data.uploadedVideo.signature,
        width: data.uploadedVideo.width,
        height: data.uploadedVideo.height,
        format: data.uploadedVideo.format,
        resource_type: data.uploadedVideo.resource_type,
        frame_rate: data.uploadedVideo.frame_rate,
        bit_rate: data.uploadedVideo.bit_rate,
        duration: data.uploadedVideo.duration,
      }
    }).save()
    console.log(media)
    if (data.tagsCreated) newAudio.tags = data.tagsCreated.map(tag => tag._id)
    if (data.authorsCreated) newAudio.authors = data.authorsCreated.map(author => author._id)
    newAudio.media = media;

    const createdNewAudio = await newAudio.save()
    let dataRes = {
      _id: createdNewAudio._id,
      topic: createdNewAudio._topic,
      description: createdNewAudio.description,
      content: createdNewAudio.content,
      type: createdNewAudio.type,
      updatedAt: createdNewAudio.updatedAt,
      tags: data.tagsCreated || [],
      media,
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
      userId: req.user._id,
      type,
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

    const newAudio = req.file
    if (newAudio) {
      const uploadedAudio = await
        CloudinaryService.uploadMediaProcess(req.user, audio, newAudio.path, `_${type}_`, audioConfig);

      query.media = uploadedAudio._id;
    }

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
        { path: 'media'}
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
      type,
    }).lean()

    if (!audio) {
      throw Boom.badRequest('Not found audio');
    }

    let result = await Promise.props({
      isDeletedPost: Post.findByIdAndDelete(audio._id),
      isDeletedAudio: cloudinary.uploader.destroy(audio.media.public_id, {
        resource_type: 'video',
      }),
    });

    if (!result.isDeletedPost) {
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
