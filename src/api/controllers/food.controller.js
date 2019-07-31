const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const Food = require('../models').Food;
const cloudinary = require('cloudinary').v2;

exports.createFoodReview = async (req, res, next) => {
  const {
    body: { tags, price, location, star, foodName },
    user,
  } = req;
  const coverImage = req.files['coverImage'][0].path;
  const foodPhotos = req.files['foodPhotos'].map(photo => photo.path);
  try {
    const newFoodBlog = new Post({
      userId: user._id,
      ...req.body,
      type: 'food',
    });

    const foodPhotosConfig = {
      folder: 'Coders-Tokyo-Forum/posts/foodReview',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image',
      transformation: [
        {
          width: 730,
          height: 730,
        },
      ],
    };
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

    // create food instance
    const foodInstance = new Food({
      postId: newFoodBlog,
      foodName,
      price,
      location,
      star,
      photos,
    });

    const result = await Promise.props({
      tags: Utils.post.createTags(newFoodBlog, tags),
      coverImage: Utils.cloudinary.uploadCoverImage(coverImage),
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

    newFoodBlog.foodInstance = foodInstance;
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
        createNewFoodInstace: foodInstance.save(),
      });

      const foodBlog = await Post.findById(isOk.createNewBlog._id)
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          {
            path: 'foodInstance',
            select: 'foodName url price location star photos',
          },
        ])
        .select('-__v -mediaInstance -authors');

      return res.status(200).json({
        status: 200,
        message: 'Create new food blog review successfully',
        data: foodBlog,
      });
    } catch (error) {
      throw Boom.badRequest('Create new food blog review failed');
    }
  } catch (error) {
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
      .populate({
        path: 'foodInstance',
        select: 'foodName url price location star photos',
      })
      .select('-__v -mediaInstance -authors');
    if (!foodReview) {
      throw Boom.badRequest('Not found foodReview, edit foodReview failed');
    }

    const {
      topic,
      description,
      content,
      tags,
      foodName,
      url,
      price,
      location,
      star,
    } = req.body;

    let queryPost = {};
    if (topic) queryPost.topic = topic;
    if (description) queryPost.description = description;
    if (content) queryPost.content = content;
    if (url) queryPost.url = url;
    if (tags) {
      const newTags = await Utils.post.removeOldTagsAndCreatNewTags(
        foodReview._id,
        tags,
      );

      if (!newTags) {
        throw Boom.serverUnavailable('Get new tags failed');
      }

      const newTagsId = newTags.map(newTag => newTag._id);
      queryPost.tags = newTagsId;
    }

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = foodReview.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      const coverImageConfig = {
        folder: 'Coders-Tokyo-Forum/posts',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
        transformation: [
          {
            width: 730,
            height: 480,
          },
        ],
      };

      const uploadedCoverImage = await Utils.cloudinary.deleteOldImageAndUploadNewImage(
        data,
        coverImageConfig,
      );

      if (!uploadedCoverImage) {
        throw Boom.badRequest('Edit cover image failed');
      }

      queryPost.cover = {
        public_id: uploadedCoverImage.public_id,
        url: uploadedCoverImage.url,
        secure_url: uploadedCoverImage.secure_url,
      };
    }

    let queryFoodInstance = {};
    if (foodName) queryFoodInstance.foodName = foodName;
    if (price) queryFoodInstance.price = price;
    if (location) queryFoodInstance.location = location;
    if (star) queryFoodInstance.star = star;

    const foodPhotosInput = files['foodPhotos'] || null;
    if (foodPhotosInput) {
      const foodPhotos = foodPhotosInput.map(photo => photo.path);
      const foodPhotosConfig = {
        folder: 'Coders-Tokyo-Forum/posts/foodReview',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
        transformation: [
          {
            width: 730,
            height: 730,
          },
        ],
      };

      const oldFoodPhotosNotUsed = foodReview.foodInstance.photos.map(photo => {
        if (!foodPhotos.includes(photo.public_id)) {
          return photo.public_id;
        }
        return null;
      });

      try {
        const result = await Promise.props({
          isDeletedoldFoodPhotosNotUsed: Utils.cloudinary.deteteManyImages(
            oldFoodPhotosNotUsed,
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

        queryFoodInstance.photos = newFoodPhotos;
      } catch (error) {
        throw Boom.badRequest('Update food blog review failed');
      }
    }

    try {
      await Promise.props({
        isUpdatedFoodInstance: Food.findByIdAndUpdate(
          foodReview.foodInstance._id,
          { $set: queryFoodInstance },
          { new: true },
        ),
        isUpdatedPost: Post.findByIdAndUpdate(
          req.params.postId,
          {
            $set: queryPost,
          },
          { new: true },
        ),
      });

      const foodReviewUpdated = await Post.findById(req.params.postId)
        .lean()
        .populate([
          { path: 'tags', select: 'tagName' },
          {
            path: 'foodInstance',
            select: 'foodName url price location star photos',
          },
        ])
        .select('-__v -mediaInstance -authors');

      return res.status(200).json({
        status: 200,
        message: 'Edit foodReview successfully',
        data: foodReviewUpdated,
      });
    } catch (error) {
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
      .populate({
        path: 'foodInstance',
        select: 'foodName url price location star photos',
      })
      .select('-__v -mediaInstance -authors');
    if (!foodReview) {
      throw Boom.badRequest('Not found food blog review');
    }
    const tagsId = foodReview.tags.map(tag => tag._id);
    const photos = foodReview.foodInstance.photos.map(photo => photo.public_id);

    try {
      await Promise.props({
        isDeletedPost: Post.findByIdAndDelete(req.params.postId),
        isDeletedFoodInstace: Food.findByIdAndDelete(
          foodReview.foodInstance._id,
        ),
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
