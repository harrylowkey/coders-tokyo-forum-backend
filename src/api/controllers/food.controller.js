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
      food: { price, location, star, foodName },
    },
    user,
  } = req;


  try {
    const newFoodBlog = new Post({
      userId: user._id,
      ...req.body,
      type,
    });

    const foodCover = req.files['coverImage'][0];
    const foodPhotos = req.files['foodPhotos'].map(photo => ({
      secureURL: photo.secure_url,
        publicId: photo.public_id,
        fileName: photo.originalname,
        sizeBytes: photo.bytes,
        userId: req.user._id,
        postId: newFoodBlog._id
    }))
    let promises = {
      foodCover: new File({
        secureURL: foodCover.secure_url,
        publicId: foodCover.public_id,
        fileName: foodCover.originalname,
        sizeBytes: foodCover.bytes,
        userId: req.user._id,
        postId: newFoodBlog._id
      }).save(),
      foodPhotos: File.insertMany(foodPhotos)
    }
    if (tags) {
      promises.tagsCreated = Utils.post.createTags(tags)
    }

    const result = await Promise.props(promises);
    const food = {
      foodName,
      price,
      location,
      star,
      photos: result.foodPhotos.map(photo => photo._id)
    };

    if (result.tagsCreated) {
      newFoodBlog.tags = result.tagsCreated.map(tag => tag._id);
    }

    newFoodBlog.cover = result.foodCover._id
    newFoodBlog.food = food;

    const createdFoodBlog = await new Post(newFoodBlog).save()
    const dataRes = {
      _id: createdFoodBlog._id,
      tags: result.tagsCreated || [],
      food: {
        ...food,
        photos: result.foodPhotos.map(photo => ({
          secureURL: photo.secureURL,
          publicId: photo.publicId,
          fileName: photo.fileName,
          sizeBytes: photo.sizeBytes
        }))
      },
      topic: createdFoodBlog.topic,
      description: createdFoodBlog.description,
      content: createdFoodBlog.content,
      type: createdFoodBlog.type,
      cover: { 
        secureURL: result.foodCover.secureURL,
        publicId: result.foodCover.publicId,
        fileName: result.foodCover.fileName,
        createdAt: result.foodCover.createdAt,
        sizeBytes: result.foodCover.sizeBytes
      },
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
      userId: req.user._id,
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
