const Tag = require('../api/models').Tag;
const Promise = require('bluebird');
const cloudinary = require('cloudinary').v2;

exports.createTagsAndUploadCoverImage = async (postId, tags, coverImage) => {
  const { path, transformation } = coverImage;
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
  const newTagsArrPromise = tags.map(tag => getTagPromise(tag, postId));

  const result = await Promise.props({
    newTags: Promise.all(newTagsArrPromise),
    uploadedCoverImage: cloudinary.uploader.upload(path, transformation),
  });

  if (!result) {
    return false;
  }

  return result;
};
