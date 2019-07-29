const Tag = require('../api/models').Tag;
const Post = require('../api/models').Post;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

exports.createTagsAndUploadCoverImage = async (postId, tags, coverImage) => {
  const config = {
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

  const getTagPromise = (tagName, postId) => {
    return new Promise(async (resolve, reject) => {
      const isExistedTag = await Tag.findOne({ tagName }).lean();
      try {
        if (isExistedTag) {
          const updatedTag = Tag.findOneAndUpdate(
            { tagName },
            {
              $push: { posts: postId },
            },
            { new: true },
          );
          return resolve(updatedTag);
        }

        const newTag = Tag.create({
          _id: mongoose.Types.ObjectId(),
          tagName,
          posts: [postId],
        });
        return resolve(newTag);
      } catch (error) {
        return reject(error);
      }
    });
  };
  const getTagsPromises = tags.map(tag => getTagPromise(tag, postId));

  const result = await Promise.props({
    tags: Promise.all(getTagsPromises),
    uploadedCoverImage: cloudinary.uploader.upload(coverImage, config),
  });

  if (!result) {
    return false;
  }

  return result;
};

exports.removeOldTagsAndCreatNewTags = async (postId, newTags) => {
  const post = await Post.findById(postId)
    .lean()
    .populate({ path: 'tags', select: 'tagName' });

  const getTagPromise = (tagName, postId) => {
    return new Promise(async (resolve, reject) => {
      const existedTag = await Tag.findOne({ tagName }).lean();
      try {
        if (existedTag) {
          return resolve(existedTag);
        }

        const newTag = Tag.create({
          _id: mongoose.Types.ObjectId(),
          tagName,
          posts: [postId],
        });
        return resolve(newTag);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const removePostsPromise = (tagName, postId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const removedPost = Tag.findOneAndUpdate(
          { tagName },
          {
            $pull: { posts: postId },
          },
          { new: true },
        );
        return resolve(removedPost);
      } catch (error) {
        return reject(error);
      }
    });
  };
  const oldTagsNotUsed = post.tags.map(tag =>
    !newTags.includes(tag.tagName) ? tag.tagName : null,
  );
  // remove posts in not used tags
  const removePostsPromises = oldTagsNotUsed.map(oldTag =>
    removePostsPromise(oldTag, postId),
  );

  const getNewTagsPromises = newTags.map(tag => getTagPromise(tag, postId));

  const result = await Promise.props({
    removePosts: Promise.all(removePostsPromises),
    getNewTags: Promise.all(getNewTagsPromises),
  });

  if (!result) return false;

  return result.getNewTags;
};
