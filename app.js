const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/api/routes/index');
const mongooseDb = require('./src/config/mongoose');
const redisDb = require('./src/config/redis');
const { port } = require('./src/config/vars');
const error = require('./src/middlewares/error-handler')
const app = express();

// connect to database
mongooseDb.connect();
redisDb.connect();

// setup middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//setup routes
app.use('/api/v1', apiRoutes);

// handler error
app.use(error.handler);

app.listen(port, () => console.log(`Server is listening on port ${port}`));
