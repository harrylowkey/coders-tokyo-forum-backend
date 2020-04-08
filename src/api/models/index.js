module.exports = {
  User: require('./user.model').model,
  Post: require('./post.model').model,
  Author: require('./author.model').model,
  Tag: require('./tag.model').model,
  Comment: require('./comment.model').model
};
