exports.handler = (err, req, res, next) => {
  const response = {};
  if (err.isBoom) {
    response.status = err.output.payload.statusCode;
    response.message = err.output.payload.message;

    res.status(err.output.statusCode).json(response);
    return res.end();
  }

  response.status = 500;
  response.message = 'Server maintaince';

  if (err.name == 'MongoError') {
    response.status = 500;
    response.name = err.name;
    response.message = err.errmsg;

    res.status(500).json(response);
    return res.end();
  }

  if (err.name == 'CastError') {
    response.status = 500;
    response.message = err.message;
    response.name = err.name;
    response.kind = err.kind;
    response.location = err.path;

    res.status(500).json(response);
    return res.end();
  }
  if ((err.message = 'validation error')) {
    console.log(err);
    response.status = err.status;
    response.message = err.message;
    response.data = err.errors;
    delete response.data[0].types;

    res.status(err.status).json(response);
    return res.end();
  }

  res.status(500).json(response);
  return res.end();
};
