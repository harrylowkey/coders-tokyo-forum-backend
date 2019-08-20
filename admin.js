const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/admin/routes');
const mongooseDb = require('./src/config/mongoose');
const { admin_port } = require('./src/config/vars');

const app = express();
// connect to database
mongooseDb.connect();

// setup middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//setup routes
app.use('/admin', apiRoutes);
app.listen(admin_port, () =>
  console.log(`Server is listening on port ${admin_port}`),
);
