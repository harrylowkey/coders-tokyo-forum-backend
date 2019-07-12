const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const adminRoutes = require('./src/admin/routes/index');
const mongoose = require('./src/config/mongoose');
const { admin_port } = require('./src/config/vars');

const app = express();
mongoose.connect();

// setup middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//setup routes
app.use('/admin', adminRoutes);
app.listen(admin_port, () => `Server is listening on port ${admin_port}`);
