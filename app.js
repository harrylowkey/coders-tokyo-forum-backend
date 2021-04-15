#!/bin/bash
require('module-alias/register')
const express = require('express');
const app = express();

const mongoDB = require('./src/config/mongoose');
const cloudinary = require('./src/config/cloudinary');

const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { port, arenaConfig } = require('./src/config/vars');

const apiRoutes = require('./src/api/routes/index');
const error = require('./src/middlewares/error-handler');

// const swaggerUi = require('swagger-ui-express');
// const swaggerDocument = require('./swagger.json');
const Arena = require('bull-arena');
const QUEUES = require('./src/config/queues');
const socket = require('@socket')

app.use(cors())

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

mongoDB.connect();
cloudinary.config();
socket.start(app)

app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// const arenaRoutes = Arena(
//   {
//     queues: QUEUES.map(q => ({
//       name: q.name,
//       prefix: q.options.prefix,
//       hostId: q.name,
//       redis: redisConfig,
//       type: 'bull',
//     })),
//   },
//   arenaConfig,
// );



// app.use('/arena', arenaRoutes);
app.use('/api/v1', apiRoutes);
app.use(error.handler);
app.listen(port, () => console.log(`Server is listening on port ${port}`));
