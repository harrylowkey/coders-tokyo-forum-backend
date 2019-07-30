const mongoose = require('mongoose');
const Boom = require('@hapi/boom');
const Utils = require('../../utils');
const User = require('../models').User;
const Post = require('../models').Post;
const Promise = require('bluebird');
const Food = require('../models').Food;
const cloudinary = require('cloudinary').v2;

exports.createFoodReview = async (req, res, next) => {
  const _id = mongoose.Types.ObjectId(); // postId
  const { tags, url, price, location, star, foodName } = req.body;
  const coverImage = req.files['coverImage'][0].path;
  const foodPhotos = req.files['foodPhotos'].map(photo => photo.path);
  try {
    // create food instance
    const foodPhotosConfig = {
      folder: 'Coders-Tokyo-Forum/posts',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image',
      transformation: [
        {
          width: 480,
          height: 480,
        },
      ],
    };
    const foodId = mongoose.Types.ObjectId();
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

    const foodInstance = await Food.create({
      _id: foodId,
      postId: _id,
      url,
      foodName,
      price,
      location,
      star,
      photos,
    });

    const result = await Promise.props({
      tags: Utils.post.createTags(_id, tags),
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

    const foodData = {
      _id,
      foodInstance: foodInstance._id,
      userId: req.user._id,
      ...req.body,
      type: 'food',
      tags: tagsId,
      cover,
    };

    const isOk = await Promise.props({
      pushBlogIdToOwner: User.findByIdAndUpdate(
        req.user._id,
        {
          $push: { posts: _id },
        },
        { new: true },
      ),
      createNewBlog: Post.create(foodData),
    });

    if (!isOk.createNewBlog || !isOk.pushBlogIdToOwner) {
      throw Boom.badRequest('Create new food blog review failed');
    }

    const blog = await Post.findById(isOk.createNewBlog._id)
      .lean()
      .populate({ path: 'tags', select: 'tagName' })
      .populate({ path: 'foodInstance', select: 'foodName url price location star photos' })
      .select('-__v -mediaInstance -authors');

    return res.status(200).json({
      status: 200,
      message: 'Create new food blog review successfully',
      data: blog,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
