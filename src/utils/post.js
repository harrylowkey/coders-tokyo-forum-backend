const Tag = require('@models').Tag;
const Author = require('@models').Author;
const Promise = require('bluebird');
const Boom = require('@hapi/boom');

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
    if (error._message === 'Author validation failed') {
      throw Boom.badRequest('Invalid author type')
    }
    throw Boom.badRequest('Create tags failed')
  }
};

exports.removeOldAuthorsAndCreateNewAuthors = async (post, newAuthors) => {
  try {
    let postAuthors = post.authors
    const mapperAuthorNameType = postAuthors.map(author => {
      let key = `${author.name}_${author.type}`
      return key
    })
    const newAuthorsToCreate = [];
    const remainAuthors = []
    newAuthors.forEach(author => {
      let key = `${author.name}_${author.type}`
      if (!mapperAuthorNameType.includes(key)) {
        newAuthorsToCreate.push({ name: author.name, type: author.type, key })
      }

      if (mapperAuthorNameType.includes(key)) {
        let sameAuthor = postAuthors.find(_author => {
          let _key = `${_author.name}_${_author.type}`
          return _key === key
        })
        remainAuthors.push(sameAuthor._id)
      }
    })


    let promises = {}
    newAuthorsToCreate.map(author => promises[author.key] = Author.findOne({ name: author.name, type: author.type }))
    let existedAuthors = await Promise.props(promises)
    let createdAuthors = []
    if (newAuthorsToCreate.length) {
      let newAuthorPromises = {}
      newAuthorsToCreate.map(author => {
        newAuthorPromises[author.key] = existedAuthors[author.key] || Author.create({ name: author.name, type: author.type })
      })

      let authors = await Promise.props(newAuthorPromises)
      createdAuthors = Object.keys(authors).map(key => ({
        _id: authors[key]._id,
        name: authors[key].name,
        type: authors[key].type
      }))
    }

    let newPostAuthors = [...remainAuthors, ...createdAuthors]
    let newAuthorIds = newPostAuthors.map(author => author._id)

    return newAuthorIds
  } catch (error) {
    if (error._message === 'Author validation failed') {
      throw Boom.badRequest('Invalid author type')
    }
    throw Boom.badRequest('Hanlde authors failed')
  };
}

exports.getmetadata = (page, limit, count) => {
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

exports.standardizePageLimitComment5 = (page = 0, limit = 5) => {
  page = Math.round(page)
  limit = Math.round(limit)
  page = Math.max(0, page || 1)
  limit = limit < 0 ? 5 : Math.min(limit || 5, 100)
  return [page, limit]
}