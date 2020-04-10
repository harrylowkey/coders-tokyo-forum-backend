require('module-alias/register')
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./src/api/routes/index');

const { port, redisConfig, arenaConfig } = require('./src/config/vars');
const error = require('./src/middlewares/error-handler');

const mongoDB = require('./src/config/mongoose');
const cloudinary = require('./src/config/cloudinary');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Arena = require('bull-arena');
const QUEUES = require('./src/queues');
const redis = require('./src/config/redis')


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, { explorer: true }));

mongoDB.connect();
cloudinary.config();
redis.config(redisConfig)
const arenaRoutes = Arena(
  {
    queues: QUEUES.map(q => ({
      name: q.name,
      prefix: q.options.prefix,
      hostId: q.name,
      redis: redis,
      type: 'bull',
    })),
  },
  arenaConfig,
);

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/arena', arenaRoutes);
app.use('/api/v1', apiRoutes);
app.use(error.handler);
app.listen(port, () => console.log(`Server is listening on port ${port}`));
