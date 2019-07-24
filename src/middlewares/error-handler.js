exports.handler = (err, req, res, next) => {
  const response = {};
  if (err.isBoom) {
    response.status = err.output.payload.statusCode;
    response.message = err.output.payload.message

    res.status(err.output.statusCode).json(response);
    return res.end();
  }
  
  response.status = 500;
  response.message = 'Server maintaince'
  
  res.status(500).json(response);
  return res.end();
}
