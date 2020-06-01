// config mongodb
const mongoose = require('mongoose');

const { mongoURL } = require('./vars');

mongoose.Promise = Promise;
const connection = () => {
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.log('Connected to DB succesfully!');
  });
};

exports.connect = () => {
  mongoose.connect(mongoURL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  });
  return connection();
};
