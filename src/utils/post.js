const Tag = require('../api/models').Tag;
const Post = require('../api/models').Post;
const Author = require('../api/models').Author;
const Promise = require('bluebird');
const Boom = require('@hapi/boom');

function getTagPromise(tagName) {
  return new Promise(async (resolve, reject) => {
    const isExistedTag = await Tag.findOne({ tagName }).lean();
    try {
      if (isExistedTag) {
        return resolve(isExistedTag);
      } else {
        const newTag = Tag.create({ tagName });
        return resolve(newTag);
      }
    } catch (error) {
      return reject(error);
    }
  });
}

function getAuthorPromise(name, type) {
  return new Promise(async (resolve, reject) => {
    const isExistedAuthor = await Author.findOne({ name, type }).lean();
    try {
      if (isExistedAuthor) {
        return resolve(isExistedAuthor);
      } else {
        const newAuthor = Author.create({
          name,
          type,
        });
        return resolve(newAuthor);
      }
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

exports.createTags = async (tags) => {
  try {
    const tagPromises = {}
    tags.map(tagName => {
      tagPromises[tagName] = Tag.findOne({ tagName }).lean()
    })
    let existedTags = [];
    let newTags = []
    const tagNames = await Promise.props(tagPromises)
    Object.keys(tagNames).map(key => {
      if (!tagNames[key]) newTags.push(key)
      else existedTags.push({
        _id: tagNames[key]._id,
        tagName: tagNames[key].tagName
      })
    })

    let createdTags = []
    if (newTags.length) {
      let newTagPromises = {}
      newTags.map(tagName => {
        newTagPromises[tagName] = Tag.create({ tagName });
      })

      let tags = await Promise.props(newTagPromises)
      createdTags = Object.keys(tags).map(key => ({
        _id: tags[key]._id,
        tagName: tags[key].tagName
      }))
    }

    return [...existedTags, ...createdTags]
  } catch (error) {
    console.log(error)
    throw Boom.badRequest('Create tags failed')
  }
};

exports.removeOldTagsAndCreatNewTags = async (post, newTags) => {
  try {
    let postTags = post.tags
    const postTagNames = postTags.map(tag => tag.tagName)
    const newTagsToCreate = [];
    const remainTags = []
    newTags.forEach(tag => {
      if (!postTagNames.includes(tag)) {
        newTagsToCreate.push(tag)
      }

      if (postTagNames.includes(tag)) {
        let sameTag = postTags.find(_tag => _tag.tagName === tag)
        remainTags.push(sameTag._id)
      }
    })
    

    let promises = {}
    newTagsToCreate.map(tagName => promises[tagName] = Tag.findOne({ tagName }))
    let existedTagNames = await Promise.props(promises)
    let createdTags = []
    if (newTagsToCreate.length) {
      let newTagPromises = {}
      newTagsToCreate.map(tagName => {
        newTagPromises[tagName] = existedTagNames[tagName] || Tag.create({ tagName })
      })

      let tags = await Promise.props(newTagPromises)
      createdTags = Object.keys(tags).map(key => ({
        _id: tags[key]._id,
        tagName: tags[key].tagName
      }))
    }

    let newPostTags = [...remainTags, ...createdTags]
    let newPostTagIds = newPostTags.map(tag => tag._id)

    return newPostTagIds
  } catch (error) {
    console.log(error)
    throw Boom.badRequest('Hanlde tags failed')
  }
};

exports.deletePostInTags = async (postId, tagsId) => {
  const deletePostPromises = tagsId.map(tagId =>
    deletePostPromise(postId, tagId),
  );
  return Promise.all(deletePostPromises);
};

exports.creatAuthors = async (_authors) => {
  try {
    const authorPromises = {}
    _authors.map(author => {
      let key = `${author.name}_${author.type}`
      authorPromises[key] = Author.findOne({ name: author.name, type: author.type }).lean()
    })
    let existedAuthors = [];
    let newAuthors = []
    const authors = await Promise.props(authorPromises)
    Object.keys(authors).map(key => {
      if (!authors[key]) {
        let authorName = key.split('_')[0]
        let type = key.split('_')[1]
        newAuthors.push({ name: authorName, type })
      }
      else existedAuthors.push({
        _id: authors[key]._id,
        name: authors[key].name,
        type: authors[key].type
      })
    })

    let createdAuthors = []
    if (newAuthors.length) {
      let newAuthorPromises = {}
      newAuthors.map(author => {
        newAuthorPromises[author.name] = Author.create({ name: author.name, type: author.type });
      })

      let authors = await Promise.props(newAuthorPromises)
      createdAuthors = Object.keys(authors).map(key => ({
        _id: authors[key]._id,
        name: authors[key].name,
        type: authors[key].type
      }))
    }

    return [...existedAuthors, ...createdAuthors]
  } catch (error) {
    console.log(error)
    throw Boom.badRequest('Create tags failed')
  }
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
  const newAuthorsId = result.getNewAuthors.map(author => author._id);
  return newAuthorsId
};

exports.deletePostInAuthors = async (postId, authorsId) => {
  const deletePostPromises = authorsId.map(authorId =>
    deletePostInAuthorsPromise(postId, authorId),
  );
  return Promise.all(deletePostPromises);
};

exports.getMetadata = (page, limit, count) => {
  return {
    page,
    pageSize: limit,
    totalPage: Math.ceil(count / limit),
    totalRecords: count
  }
}

exports.standardizePageLimit20 = (page = 0, limit = 20) => {
  page = Math.round(page)
  limit = Math.round(limit)
  page = Math.max(0, page || 1)
  limit = limit < 0 ? 20 : Math.min(limit || 20, 100)

  return [page, limit]
}