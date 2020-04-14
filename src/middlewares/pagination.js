const Utils = require('@utils')
module.exports = (option) => (req, res, next) => {
  const [_page, _limit] = Utils.post.standardizePageLimit20(
    (option && option.page) ? option.page : req.query.page, 
    (option && option.limit) ? option.limit : req.query.limit
  )
  req.page = _page
  req.limit = _limit;
  next();
};
