const Utils = require('@utils')
module.exports = (option) => (req, res, next) => {
  const [_page, _limit] = Utils.post.standardizePageLimit20(
    option.page || req.query.page, 
    option.limit || req.query.limit
  )
  req.page = _page
  req.limit = _limit;
  next();
};
