const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/api/routes/index');
const mongooseDb = require('./src/config/mongoose');
const { port, redis, arena } = require('./src/config/vars');
const error = require('./src/middlewares/error-handler');
const cloudinary = require('./src/config/cloudinary');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Arena = require('bull-arena');
const queues = require('./src/queues');
const app = express();

//config swagger-ui-express
var options = {
  explorer: true
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

// connect to database
mongooseDb.connect();

// config cloudinary
cloudinary.config();

// setup middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//setup bull-arena
// const arenaRoutes = Arena(
//   {
//     queues: queues.map(q => ({
//       name: q.name,
//       prefix: q.options.prefix,
//       hostId: q.name,
//       redis: redis,
//       type: 'bull',
//     })),
//   },
//   arena,
// );

// app.use('/arena', arenaRoutes);

//setup routes
app.use('/api/v1', apiRoutes);

// handler error
app.use(error.handler);

app.listen(port, () => console.log(`Server is listening on port ${port}`));
