const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/api/routes/index');
const mongoose = require('./src/config/mongoose');
const { port } = require('./src/config/vars');

const app = express();
mongoose.connect();

// setup middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//setup routes
app.use('/api/v1', apiRoutes);
app.listen(port, () => console.log(`Server is listening on port ${port}`));
