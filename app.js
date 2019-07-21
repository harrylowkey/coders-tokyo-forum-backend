const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/api/routes/index');
const mongooseDb = require('./src/config/mongoose');
const redisDb = require('./src/config/redis');
const { port } = require('./src/config/vars');

const app = express();
<<<<<<< HEAD
=======
mongoose.connect();
const mongooseDb = require('./src/config/mongoose');
const redisDb = require('./src/config/redis');
const { port } = require('./src/config/vars');

const app = express();
>>>>>>> 572b481766e56327629155717042e215a589d2fc
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
app.listen(port, () => console.log(`Server is listening on port ${port}`));
