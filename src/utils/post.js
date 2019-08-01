const Tag = require('../api/models').Tag;
const Post = require('../api/models').Post;
const Author = require('../api/models').Author;
const Promise = require('bluebird');

function getTagPromise(tagName, postId) {
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
        tagName,
        posts: [postId],
      });
      return resolve(newTag);
    } catch (error) {
      return reject(error);
    }
  });
}

function getAuthorPromise(name, type, postId) {
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
        name,
        type,
        posts: [postId],
      });
      return resolve(newAuthor);
    } catch (error) {
      return reject(error);
    }
  });
}

function deletePostInAuthorsPromise(postId, authorId) {
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
}

function deletePostPromise(postId, tagId) {
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
}

exports.createTags = async (postId, tags) => {
  const getTagsPromises = tags.map(tag => getTagPromise(tag, postId));
  return Promise.all(getTagsPromises);
};

exports.removeOldTagsAndCreatNewTags = async (postId, newTags) => {
  const post = await Post.findById(postId)
    .lean()
    .populate({ path: 'tags', select: 'tagName' });

  const oldTagsId = post.tags.map(tag => tag._id);
  const removePostsPromises = oldTagsId.map(oldTagId =>
    deletePostPromise(postId, oldTagId),
  );
  const getNewTagsPromises = newTags.map(tag => getTagPromise(tag, postId));

  const result = await Promise.props({
    removePosts: Promise.all(removePostsPromises),
    getNewTags: Promise.all(getNewTagsPromises),
  });

  if (!result) return false;

  return result.getNewTags;
};

exports.deletePostInTags = async (postId, tagsId) => {
  const deletePostPromises = tagsId.map(tagId =>
    deletePostPromise(postId, tagId),
  );
  return Promise.all(deletePostPromises);
};

exports.creatAuthors = async (postId, authors) => {
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

  // remove posts in old authors
  const oldAuthorsId = post.authors.map(author => author._id);
  // get old author id
  const deletePostsPromises = oldAuthorsId.map(oldAuthorId =>
    deletePostInAuthorsPromise(postId, oldAuthorId),
  );
  const getNewAuthorsPromises = newAuthors.map(author =>
    getAuthorPromise(author.name, author.type, postId),
  );

  const result = await Promise.props({
    deletePosts: Promise.all(deletePostsPromises),
    getNewAuthors: Promise.all(getNewAuthorsPromises),
  });

  if (!result) return false;
  return result.getNewAuthors;
};

exports.deletePostInAuthors = async (postId, authorsId) => {
  const deletePostPromises = authorsId.map(authorId =>
    deletePostInAuthorsPromise(postId, authorId),
  );
  return Promise.all(deletePostPromises);
};
