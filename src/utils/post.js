const { Tag } = require('@models');
const { Author } = require('@models');
const Promise = require('bluebird');
const Boom = require('@hapi/boom');

exports.createTags = async (tags) => {
  try {
    const tagPromises = {};
    tags.map((tagName) => {
      tagPromises[tagName] = Tag.findOne({ tagName }).lean();
    });
    const existedTags = [];
    const newTags = [];
    const tagNames = await Promise.props(tagPromises);
    Object.keys(tagNames).map((key) => {
      if (!tagNames[key]) newTags.push(key);
      else {
        existedTags.push({
          _id: tagNames[key]._id,
          tagName: tagNames[key].tagName,
        });
      }
    });

    let createdTags = [];
    if (newTags.length) {
      const newTagPromises = {};
      newTags.map((tagName) => {
        newTagPromises[tagName] = Tag.create({ tagName });
      });

      const tags = await Promise.props(newTagPromises);
      createdTags = Object.keys(tags).map((key) => ({
        _id: tags[key]._id,
        tagName: tags[key].tagName,
      }));
    }

    return [...existedTags, ...createdTags];
  } catch (error) {
    console.log(error);
    throw Boom.badRequest('Create tags failed');
  }
};

exports.removeOldTagsAndCreatNewTags = async (post, newTags) => {
  try {
    const postTags = post.tags;
    const postTagNames = postTags.map((tag) => tag.tagName);
    const newTagsToCreate = [];
    const remainTags = [];
    newTags.forEach((tag) => {
      if (!postTagNames.includes(tag)) {
        newTagsToCreate.push(tag);
      }

      if (postTagNames.includes(tag)) {
        const sameTag = postTags.find((_tag) => _tag.tagName === tag);
        remainTags.push(sameTag._id);
      }
    });


    const promises = {};
    newTagsToCreate.map((tagName) => promises[tagName] = Tag.findOne({ tagName }));
    const existedTagNames = await Promise.props(promises);
    let createdTags = [];
    if (newTagsToCreate.length) {
      const newTagPromises = {};
      newTagsToCreate.map((tagName) => {
        newTagPromises[tagName] = existedTagNames[tagName] || Tag.create({ tagName });
      });

      const tags = await Promise.props(newTagPromises);
      createdTags = Object.keys(tags).map((key) => ({
        _id: tags[key]._id,
        tagName: tags[key].tagName,
      }));
    }

    const newPostTags = [...remainTags, ...createdTags];
    const newPostTagIds = newPostTags.map((tag) => tag._id);

    return newPostTagIds;
  } catch (error) {
    console.log(error);
    throw Boom.badRequest('Hanlde tags failed');
  }
};

exports.creatAuthors = async (_authors) => {
  try {
    const authorPromises = {};
    _authors.map((author) => {
      const key = `${author.name}_${author.type}`;
      authorPromises[key] = Author.findOne({ name: author.name, type: author.type }).lean();
    });
    const existedAuthors = [];
    const newAuthors = [];
    const authors = await Promise.props(authorPromises);
    Object.keys(authors).map((key) => {
      if (!authors[key]) {
        const authorName = key.split('_')[0];
        const type = key.split('_')[1];
        newAuthors.push({ name: authorName, type });
      } else {
        existedAuthors.push({
          _id: authors[key]._id,
          name: authors[key].name,
          type: authors[key].type,
        });
      }
    });

    let createdAuthors = [];
    if (newAuthors.length) {
      const newAuthorPromises = {};
      newAuthors.map((author) => {
        newAuthorPromises[author.name] = Author.create({ name: author.name, type: author.type });
      });

      const authors = await Promise.props(newAuthorPromises);
      createdAuthors = Object.keys(authors).map((key) => ({
        _id: authors[key]._id,
        name: authors[key].name,
        type: authors[key].type,
      }));
    }

    return [...existedAuthors, ...createdAuthors];
  } catch (error) {
    console.log(error);
    if (error._message === 'Author validation failed') {
      throw Boom.badRequest('Invalid author type');
    }
    throw Boom.badRequest('Create tags failed');
  }
};

exports.removeOldAuthorsAndCreateNewAuthors = async (post, newAuthors) => {
  try {
    const postAuthors = post.authors;
    const mapperAuthorNameType = postAuthors.map((author) => {
      const key = `${author.name}_${author.type}`;
      return key;
    });
    const newAuthorsToCreate = [];
    const remainAuthors = [];
    newAuthors.forEach((author) => {
      const key = `${author.name}_${author.type}`;
      if (!mapperAuthorNameType.includes(key)) {
        newAuthorsToCreate.push({ name: author.name, type: author.type, key });
      }

      if (mapperAuthorNameType.includes(key)) {
        const sameAuthor = postAuthors.find((_author) => {
          const _key = `${_author.name}_${_author.type}`;
          return _key === key;
        });
        remainAuthors.push(sameAuthor._id);
      }
    });


    const promises = {};
    newAuthorsToCreate.map(
      (author) => promises[author.key] = Author.findOne({ name: author.name, type: author.type }),
    );
    const existedAuthors = await Promise.props(promises);
    let createdAuthors = [];
    if (newAuthorsToCreate.length) {
      const newAuthorPromises = {};
      newAuthorsToCreate.map((author) => {
        newAuthorPromises[author.key] = existedAuthors[author.key] || Author.create({ name: author.name, type: author.type });
      });

      const authors = await Promise.props(newAuthorPromises);
      createdAuthors = Object.keys(authors).map((key) => ({
        _id: authors[key]._id,
        name: authors[key].name,
        type: authors[key].type,
      }));
    }

    const newPostAuthors = [...remainAuthors, ...createdAuthors];
    const newAuthorIds = newPostAuthors.map((author) => author._id);

    return newAuthorIds;
  } catch (error) {
    if (error._message === 'Author validation failed') {
      throw Boom.badRequest('Invalid author type');
    }
    throw Boom.badRequest('Hanlde authors failed');
  }
};

exports.getmetadata = (page, limit, count) => ({
  page,
  pageSize: limit,
  totalPage: Math.ceil(count / limit),
  totalRecords: count,
});

exports.standardizePageLimit20 = (page = 0, limit = 20) => {
  page = Math.round(page);
  limit = Math.round(limit);
  page = Math.max(0, page || 1);
  limit = limit < 0 ? 20 : Math.min(limit || 20, 100);
  return [page, limit];
};

exports.standardizePageLimit5 = (page = 0, limit = 5) => {
  page = Math.round(page);
  limit = Math.round(limit);
  page = Math.max(0, page || 1);
  limit = limit < 0 ? 5 : Math.min(limit || 5, 100);
  return [page, limit];
};

exports.standardizePageLimitComment5 = (page = 0, limit = 5) => {
  page = Math.round(page);
  limit = Math.round(limit);
  page = Math.max(0, page || 1);
  limit = limit < 0 ? 5 : Math.min(limit || 5, 100);
  return [page, limit];
};
