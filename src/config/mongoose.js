// config mongodb
var mongoose = require('mongoose');

var { mongo_uri } = require('../config/vars');

mongoose.Promise = Promise;
const connection = () => {
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('Connected to DB succesfully!');
  });
  
};

exports.connect = () => {
  mongoose.connect(mongo_uri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  });
  return connection();
};
