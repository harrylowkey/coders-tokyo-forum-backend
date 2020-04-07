const Utils = require('../utils')
module.exports = () => (req, res, next) => {
  const [page, limit] = Utils.post.standardizePageLimit20(req.query.page, req.query.limit)
  req.page = page
  req.limit = limit;
  next();
};
