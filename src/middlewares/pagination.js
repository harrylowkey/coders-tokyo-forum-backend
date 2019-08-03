module.exports = ({ limit }) => (req, res, next) => {
  const { page = 1 } = req.query;
  const skip = (page - 1) * limit;

  req.limit = limit;
  req.skip = skip;
  next();
};
