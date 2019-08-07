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
    response.status = err.status || err.http_code;
    response.message = 'field ' + err.errors[0].messages + ' in ' + err.errors[0].location;
    res.status(err.status || err.http_code).json(response);
    return res.end();
  }

  res.status(500).json(response);
  return res.end();
};
