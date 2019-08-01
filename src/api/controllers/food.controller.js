const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig, foodPhotosConfig } = require('../../config/vars');

exports.createFoodReview = async (req, res, next) => {
  const {
    body: {
      tags,
      food: { price, location, star, foodName },
    },
    user,
  } = req;

  const coverImage = req.files['coverImage'][0].path;
  const foodPhotos = req.files['foodPhotos'].map(photo => photo.path);
  try {
    const uploadedFoodPhotos = await Utils.cloudinary.uploadManyImages(
      foodPhotos,
      foodPhotosConfig,
    );

    if (!uploadedFoodPhotos) {
      throw Boom.badRequest('Create food blog review failed');
    }

    const photos = uploadedFoodPhotos.map(photo => ({
      public_id: photo.public_id,
      url: photo.url,
      secure_url: photo.secure_url,
    }));

    const food = {
      foodName,
      price,
      location,
      star,
      photos,
    };

    const newFoodBlog = new Post({
      userId: user._id,
      ...req.body,
      food,
      type: 'food',
    });

    const result = await Promise.props({
      tags: Utils.post.createTags(newFoodBlog, tags),
      coverImage: cloudinary.uploader.upload(coverImage, coverImageConfig),
    });

    if (!result) {
      throw Boom.serverUnavailable('Create tag and upload cover image false');
    }

    const tagsId = result.tags.map(tag => ({
      _id: tag.id,
    }));

    const cover = {
      public_id: result.coverImage.public_id,
      url: result.coverImage.url,
      secure_url: result.coverImage.secure_url,
    };

    newFoodBlog.tags = tagsId;
    newFoodBlog.cover = cover;

    try {
      const isOk = await Promise.props({
        pushBlogIdToOwner: User.findByIdAndUpdate(
          user._id,
          {
            $push: { posts: newFoodBlog },
          },
          { new: true },
        ),
        createNewBlog: newFoodBlog.save(),
      });

      const foodBlog = await Post.findById(isOk.createNewBlog._id)
        .lean()
        .populate({ path: 'tags', select: 'tagName' })
        .select('-__v -media -authors');

      return res.status(200).json({
        status: 200,
        message: 'Create new food blog review successfully',
        data: foodBlog,
      });
    } catch (error) {
      console.log(error);
      throw Boom.badRequest('Create new food blog review failed');
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

exports.editFoodReview = async (req, res, next) => {
  try {
    const foodReview = await Post.findOne({
      _id: req.params.postId,
      type: 'food',
    })
      .lean()
      .populate({
        path: 'tags',
        select: 'tagName',
      })
      .select('-__v -authors');
    if (!foodReview) {
      throw Boom.notFound('Not found foodReview, edit foodReview failed');
    }

    const {
      url,
      topic,
      description,
      content,
      tags,
      food: { price, location, star, foodName },
    } = req.body;

    let query = {};
    if (topic) query.topic = topic;
    if (description) query.description = description;
    if (content) query.content = content;
    if (url) query.url = url;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        foodReview._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }

      const newTagsId = newTags.map(newTag => newTag._id);
      query.tags = newTagsId;
    }

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = foodReview.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      const uploadedCoverImage = await Utils.cloudinary.deleteOldImageAndUploadNewImage(
        data,
        coverImageConfig,
      );

      if (!uploadedCoverImage) {
        throw Boom.serverUnavailable('Edit cover image failed');
      }

      query.cover = {
        public_id: uploadedCoverImage.public_id,
        url: uploadedCoverImage.url,
        secure_url: uploadedCoverImage.secure_url,
      };
    }

    query.food = {};
    if (foodName) query.food.foodName = foodName;
    if (price) query.food.price = price;
    if (location) query.food.location = location;
    if (star) query.food.star = star;

    const foodPhotosInput = files['foodPhotos'] || null;
    if (foodPhotosInput) {
      const foodPhotos = foodPhotosInput.map(photo => photo.path);
      const oldFoodPhotos = foodReview.food.photos || null;
      let oldFoodPhotosId = [];

      if (oldFoodPhotos) {
        oldFoodPhotosId = oldFoodPhotos.map(photo => photo.public_id);
      }
      try {
        const result = await Promise.props({
          isDeletedoldFoodPhotosNotUsed: Utils.cloudinary.deteteManyImages(
            oldFoodPhotosId,
          ),
          isUploadedNewFoodPhotos: Utils.cloudinary.uploadManyImages(
            foodPhotos,
            foodPhotosConfig,
          ),
        });

        const newPhotos = result.isUploadedNewFoodPhotos;
        const newFoodPhotos = newPhotos.map(photo => ({
          public_id: photo.public_id,
          url: photo.url,
          secure_url: photo.secure_url,
        }));

        query.food.photos = newFoodPhotos;
      } catch (error) {
        console.log(error);
        throw Boom.badRequest('Update food blog review failed');
      }
    }

    try {
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
        message: 'Edit food blog review successfully',
        data: upadatedFoodReview,
      });
    } catch (error) {
      console.log(error);
      throw Boom.badRequest('Update food blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};

exports.deleteFoodReview = async (req, res, next) => {
  try {
    const foodReview = await Post.findOne({
      _id: req.params.postId,
      type: 'food',
    })
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .select('-__v -authors');
    if (!foodReview) {
      throw Boom.notFound('Not found food blog review');
    }
    const tagsId = foodReview.tags.map(tag => tag._id);
    const photos = foodReview.food.photos.map(photo => photo.public_id);

    try {
      await Promise.props({
        isDeletedPost: Post.findByIdAndDelete(req.params.postId),
        isDeletedCoverImage: cloudinary.uploader.destroy(
          foodReview.cover.public_id,
        ),
        isDetetedInOwner: User.findByIdAndUpdate(
          req.user._id,
          {
            $pull: { posts: req.params.postId },
          },
          { new: true },
        ),
        isDeletedInTags: Utils.post.deletePostInTags(foodReview._id, tagsId),
        isDeletedFoodPhotos: Utils.cloudinary.deteteManyImages(photos),
      });

      return res.status(200).json({
        status: 200,
        message: `Delete food blog review successfully`,
      });
    } catch (error) {
      throw Boom.badRequest('Delete food blog review failed');
    }
  } catch (error) {
    return next(error);
  }
};
