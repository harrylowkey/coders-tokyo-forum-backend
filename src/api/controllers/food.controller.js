const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createFoodReview = async (req, res, next) => {
  const type = 'food';
  const {
    body: {
      tags,
      cover,
      food,
    },
    user,
  } = req;

  try {
    const newFoodBlog = new Post({
      user: user._id,
      ...req.body,
      type,
    });

    let createdTags = [];
    if (tags) createdTags = await Utils.post.createTags(tags);
    if (tags) newFoodBlog.tags = createdTags.map(tag => tag._id);

    newFoodBlog.cover = cover._id;
    newFoodBlog.food = food;
    let a = []
    if (newFoodBlog.food.foodPhotos.length) {
      a = newFoodBlog.food.foodPhotos.map(photo => {
        return File.findByIdAndUpdate(
          photo._id,
          {
            $set: { postId: newFoodBlog._id }
          },
          { new: true }
        );
      });
    }

    const promises = [
      newFoodBlog.save(),
      File.findByIdAndUpdate(
        cover._id,
        {
          $set: { postId: newFoodBlog._id }
        },
        { new: true }
      )
    ];

    const [createdFoodBlog, _] = await Promise.all(promises);
    const dataRes = {
      _id: createdFoodBlog._id,
      tags: createdTags,
      food,
      topic: createdFoodBlog.topic,
      description: createdFoodBlog.description,
      content: createdFoodBlog.content,
      type: createdFoodBlog.type,
      cover: req.body.cover,
      createdAt: createdFoodBlog.createdAt
    };
    return res.status(200).json({
      status: 200,
      data: dataRes
    });
  } catch (error) {
    return next(error);
  }

};

exports.editFoodReview = async (req, res, next) => {
  const type = 'food';
  try {
    const foodReview = await Post.findOne({
      _id: req.params.postId,
      user: req.user._id,
      type,
    })
      .lean()
      .populate({
        path: 'tags',
        select: 'tagName',
      })
      .select('-__v -authors');
    if (!foodReview) {
      throw Boom.badRequest('Not found foodReview, edit foodReview failed');
    }

    const {
      url,
      topic,
      description,
      content,
      tags,
      food,
      cover
    } = req.body;

    let query = { food };
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (url) query.url = url;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        foodReview,
        tags,
      );
      query.tags = newTags;
    }

    if (cover) {
      query.cover = cover;
    }

    await Post.findByIdAndUpdate(
      req.params.postId,
      {
        $set: query,
      },
      { new: true },
    );

    const upadatedFoodReview = await Post.findById(req.params.postId)
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .select('-__v -media -authors');

    return res.status(200).json({
      status: 200,
      data: upadatedFoodReview,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteFoodReview = async (req, res, next, type) => {
  try {
    const foodReview = await Post.findOne({
      _id: req.params.postId,
      type,
    }).lean();

    if (!foodReview) {
      throw Boom.badRequest('Not found food blog review');
    }
    const photos = foodReview.foodPhotos.map(photo => photo.public_id);

    let result = await Promise.props({
      idDeletedFoodBlog: Post.findByIdAndDelete(req.params.postId),
      isDeletedCoverImage: cloudinary.uploader.destroy(
        foodReview.cover.public_id,
      ),
      isDeletedFoodPhotos: CloudinaryService.deteteManyImages(photos),
    });

    if (!result.idDeletedFoodBlog) {
      throw Boom.badRequest('Delete food blog fail');
    }

    return res.status(200).json({
      status: 200,
      message: `Delete food blog review successfully`,
    });

  } catch (error) {
    return next(error);
  }
};
