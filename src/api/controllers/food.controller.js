const Boom = require('@hapi/boom');
const Utils = require('@utils');
const { Post, File } = require('@models');
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const { coverImageConfig, foodPhotosConfig } = require('@configVar');

exports.createFoodReview = async (req, res, next) => {
  const type = 'food'
  const {
    body: {
      tags,
      banner,
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

    const foodPhotos = req.files['foodPhotos'].map(photo => ({
      secureURL: photo.secure_url,
        publicId: photo.public_id,
        fileName: photo.originalname,
        sizeBytes: photo.bytes,
        user: req.user._id,
        postId: newFoodBlog._id
    }))

    let blogTags = []
    newBlog.cover = req.body.banner._id
    
    let _promises = {
      foodPhotos: File.insertMany(foodPhotos)
    }
    if (tags) promises.createdTags = Utils.post.createTags(tags)

    const result = await Promise.props(_promises);
    if (tags) newBlog.tags = result.createdTags.map(tag => tag._id)
    newFoodBlog.foodPhotos = result.foodPhotos.map(photo => photo._id)

    newFoodBlog.cover = result.foodCover._id
    newFoodBlog.food = food;

    const promises = [
      newFoodBlog.save(),
      File.findByIdAndUpdate(
        banner._id,
        {
          $set: { postId: newFoodBlog._id }
        },
        { new: true }
      )
    ]

    const [createdFoodBlog, _] = await Promise.all(promises)
    const dataRes = {
      _id: createdFoodBlog._id,
      tags:blogTags,
      food,
      foodPhotos: result.foodPhotos.map(photo => ({
        secureURL: photo.secureURL,
        publicId: photo.publicId,
        fileName: photo.fileName,
        sizeBytes: photo.sizeBytes
      })),
      topic: createdFoodBlog.topic,
      description: createdFoodBlog.description,
      content: createdFoodBlog.content,
      type: createdFoodBlog.type,
      cover: req.body.banner,
      createdAt: createdFoodBlog.createdAt
    }
    return res.status(200).json({
      status: 200,
      data: dataRes
    });
  } catch (error) {
    return next(error)
  }

};

exports.editFoodReview = async (req, res, next, type) => {
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
      food: { priceAverage, address, restaurant, quality, service, space, openTime, foodName, price, starts },
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

    let blogCover = req.file
    if (blogCover) {
      try {
        const uploadedCoverImage = await CloudinaryService.uploadFileProcess(req.user, foodReview, blogCover, '_blog_image_cover_');

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
    query.food = oldFoodData
    if (priceAverage) query.food.priceAverage = priceAverage;
    if (address) query.food.address = address;
    if (restaurant) query.food.restaurant = restaurant;
    if (quality) query.food.quality = quality;
    if (service) query.food.service = service;
    if (space) query.food.space = space;
    if (openTime) query.food.openTime = openTime;
    if (foodName) query.food.foodName = foodName;
    if (price) query.food.price = price;
    if (stars) query.food.stars = stars;

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

        query.foodPhotos = newFoodPhotos;
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
    const photos = foodReview.foodPhotos.map(photo => photo.public_id);

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
