const Tag = require('../api/models').Tag;
const Post = require('../api/models').Post;
const Author = require('../api/models').Author;
const Promise = require('bluebird');
const mongoose = require('mongoose');

exports.createTags = async (postId, tags) => {
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

  return Promise.all(getTagsPromises);
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

  const getNewTagsPromises = newTags.map(tag => getTagPromise(tag, postId));

  // remove posts in not used tags
  const oldTagsNameNotUsed = post.tags.map(tag =>
    !newTags.includes(tag.tagName) ? tag.tagName : null,
  );
  const removePostsPromises = oldTagsNameNotUsed.map(oldTag =>
    removePostsPromise(oldTag, postId),
  );

  const result = await Promise.props({
    removePosts: Promise.all(removePostsPromises),
    getNewTags: Promise.all(getNewTagsPromises),
  });

  if (!result) return false;

  return result.getNewTags;
};

exports.deletePostInTags = async (postId, tagsId) => {
  const deletePostPromise = (postId, tagId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deletedPost = Tag.findByIdAndUpdate(
          tagId,
          {
            $pull: { posts: postId },
          },
          { new: true },
        );
        return resolve(deletedPost);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const deletePostPromises = tagsId.map(tagId =>
    deletePostPromise(postId, tagId),
  );

  return Promise.all(deletePostPromises);
};

exports.creatAuthors = async (postId, authors) => {
  const getAuthorPromise = (name, type, postId) => {
    return new Promise(async (resolve, reject) => {
      const isExistedAuthor = await Author.findOne({ name, type }).lean();
      try {
        if (isExistedAuthor) {
          const updatedAuthor = Author.findOneAndUpdate(
            { name, type },
            {
              $push: { posts: postId },
            },
            { new: true },
          );
          return resolve(updatedAuthor);
        }

        const newAuthor = Author.create({
          _id: mongoose.Types.ObjectId(),
          name,
          type,
          posts: [postId],
        });
        return resolve(newAuthor);
      } catch (error) {
        return reject(error);
      }
    });
  };
  const getAuthorsPromises = authors.map(author =>
    getAuthorPromise(author.name, author.type, postId),
  );
  return Promise.all(getAuthorsPromises);
};

exports.removeOldAuthorsAndCreateNewAuthors = async (postId, newAuthors) => {
  const post = await Post.findById(postId)
    .lean()
    .populate({ path: 'tags', select: 'tagName' })
    .populate({ path: 'authors', select: 'name type' });

  const getAuthorPromise = (name, type, postId) => {
    return new Promise(async (resolve, reject) => {
      const isExistedAuthor = await Author.findOne({ name, type }).lean();
      try {
        if (isExistedAuthor) {
          const updatedAuthor = Author.findOneAndUpdate(
            { name, type },
            {
              $push: { posts: postId },
            },
            { new: true },
          );
          return resolve(updatedAuthor);
        }

        const newAuthor = Author.create({
          _id: mongoose.Types.ObjectId(),
          name,
          type,
          posts: [postId],
        });
        return resolve(newAuthor);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const deletePostPromise = (postId, authorId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deletedPost = Author.findByIdAndUpdate(
          authorId,
          {
            $pull: { posts: postId },
          },
          { new: true },
        );
        return resolve(deletedPost);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const getNewAuthorsPromises = newAuthors.map(author =>
    getAuthorPromise(author.name, author.type, postId),
  );

  // remove posts in not used authors
  const newAuthorsName = newAuthors.map(newAuthor => newAuthor.name);

  const oldAuthorsIdNotUsed = post.authors.map(author =>
    !newAuthorsName.includes(author.name) ? author._id : null,
  );

  // get old author not used id
  const deletePostsPromises = oldAuthorsIdNotUsed.map(oldAuthorId =>
    deletePostPromise(postId, oldAuthorId),
  );

  const result = await Promise.props({
    deletePosts: Promise.all(deletePostsPromises),
    getNewAuthors: Promise.all(getNewAuthorsPromises),
  });

  if (!result) return false;

  return result.getNewAuthors;
};

exports.deletePostInAuthors = async (postId, authorsId) => {
  const deletePostPromise = (postId, authorId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const deletedPost = Author.findByIdAndUpdate(
          authorId,
          {
            $pull: { posts: postId },
          },
          { new: true },
        );
        return resolve(deletedPost);
      } catch (error) {
        return reject(error);
      }
    });
  };

  const deletePostPromises = authorsId.map(authorId =>
    deletePostPromise(postId, authorId),
  );

  return Promise.all(deletePostPromises);
};
