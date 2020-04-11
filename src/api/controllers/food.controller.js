const Boom = require('@hapi/boom');
const Utils = require('@utils');
const Post = require('@models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig, foodPhotosConfig } = require('@configVar');

exports.createFoodReview = async (req, res, next, type) => {
  //TODO: validate reqBody
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
    const newFoodBlog = {
      userId: user._id,
      ...req.body,
      type,
    };

    let promises = {
      coverImage: cloudinary.uploader.upload(coverImage, coverImageConfig),
      foodPhotos: CloudinaryService.uploadManyImages(
        foodPhotos,
        foodPhotosConfig,
      )
    }

    if (tags) {
      promises.tagsCreated = Utils.post.createTags(tags)
    }
    const result = await Promise.props(promises);
    const cover = {
      public_id: result.coverImage.public_id,
      url: result.coverImage.url,
      secure_url: result.coverImage.secure_url,
    };

    const photos = result.foodPhotos.map(photo => ({
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

    if (result.tagsCreated) {
      newFoodBlog.tags = result.tagsCreated.map(tag => tag._id);
    }

    newFoodBlog.cover = cover;
    newFoodBlog.food = food;

    const createdFoodBlog = await new Post(newFoodBlog).save()
    const dataRes = {
      _id: createdFoodBlog._id,
      tags: result.tagsCreated || [],
      food: createdFoodBlog.food,
      topic: createdFoodBlog.topic,
      description: createdFoodBlog.description,
      content: createdFoodBlog.content,
      type: createdFoodBlog.type,
      cover: createdFoodBlog.cover,
      createdAt: createdFoodBlog.createdAt
    }
    return res.status(200).json({
      status: 200,
      data: dataRes
    });
  } catch (error) {
    console.log(error);
    throw Boom.badRequest('Create new food blog review failed');
  }

};

exports.editFoodReview = async (req, res, next, type) => {
  try {
    const foodReview = await Post.findOne({
      _id: req.params.postId,
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
      food: { price, location, star, foodName },
    } = req.body;

    let query = {};
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

    const files = req.files || {};
    const coverImageInput = files['coverImage'] || null;
    if (coverImageInput) {
      const coverImage = coverImageInput[0].path;
      const oldCover = foodReview.cover || {};
      const oldCoverId = oldCover.public_id || 'null'; // 2 cases: public_id || null -> assign = 'null'

      const data = { oldImageId: oldCoverId, newImage: coverImage };
      try {
        const uploadedCoverImage = await CloudinaryService.deleteOldImageAndUploadNewImage(
          data,
          coverImageConfig,
        );

        query.cover = {
          public_id: uploadedCoverImage.public_id,
          url: uploadedCoverImage.url,
          secure_url: uploadedCoverImage.secure_url,
        };
      } catch (error) {
        throw Boom.badRequest(error.message);
      }
    }

    let oldFoodData = foodReview.food
    query.food = {
      foodName: oldFoodData.foodName,
      price: oldFoodData.price,
      location: oldFoodData.location,
      status: oldFoodData.status
    };
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
          isDeletedoldFoodPhotosNotUsed: CloudinaryService.deteteManyImages(
            oldFoodPhotosId,
          ),
          isUploadedNewFoodPhotos: CloudinaryService.uploadManyImages(
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
        throw Boom.badRequest(error.message);
      }
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
    }).lean()

    if (!foodReview) {
      throw Boom.badRequest('Not found food blog review');
    }
    const photos = foodReview.food.photos.map(photo => photo.public_id);

    let result = await Promise.props({
      idDeletedFoodBlog: Post.findByIdAndDelete(req.params.postId),
      isDeletedCoverImage: cloudinary.uploader.destroy(
        foodReview.cover.public_id,
      ),
      isDeletedFoodPhotos: CloudinaryService.deteteManyImages(photos),
    });

    if (!result.idDeletedFoodBlog) {
      throw Boom.badRequest('Delete food blog fail')
    }

    return res.status(200).json({
      status: 200,
      message: `Delete food blog review successfully`,
    });

  } catch (error) {
    return next(error);
  }
};
