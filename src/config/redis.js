const Redis = require('ioredis');
const zlib = require('zlib');
const configVar = require('@configVar');

const redis = new Redis(configVar.redis_uri);

const redisPrefix = configVar.redisPrefix || 'CodersX-Forum';

const compress = (data) => {
  const binary = zlib.gzipSync(data).toString('binary');
  return Promise.resolve(binary);
};

const decompress = (data) => {
  if (!data) throw new Error('Can not decompress null data');

  const d = zlib.unzipSync(new Buffer(data, 'binary')).toString();
  return Promise.resolve(d);
};

const cacheExecute = async (params, func) => {
  const { key } = params;
  const { isZip } = params;
  const { isJSON } = params;
  const { ttl } = params;

  if (!key) throw new Error('missing key');

  return redis.get(key)
    .then((dataInCache) => {
      if (!dataInCache) {
        return func()
          .then((data) => setCache({
            key,
            value: data,
            isJSON,
            isZip,
            ttl,
          })
            .then(() => data));
      }
      if (isZip) {
        return decompress(dataInCache)
          .then((plainText) => (isJSON ? JSON.parse(plainText) : plainText));
      }
      return isJSON === true ? JSON.parse(dataInCache) : dataInCache;
    });
};

let setCache = (params) => {
  if (!params.key) throw new Error('missing key');
  if (params.value === undefined) throw new Error(`missing value to setCache (redis key: ${params.key})`);

  const value = params.isJSON ? JSON.stringify(params.value) : params.value;

  if (params.isZip) {
    return compress(value)
      .then((ziped) => (params.ttl ? redis.set(params.key, ziped, 'EX', params.ttl) : redis.set(params.key, ziped)));
  } return params.ttl ? redis.set(params.key, value, 'EX', params.ttl) : redis.set(params.key, value);
};

const getCache = (params) => {
  if (!params.key) throw new Error('missing key');

  return redis.get(params.key)
    .then((data) => {
      if (!data) return;

      if (params.isZip) {
        return decompress(data)
          .then((plain) => (params.isJSON ? JSON.parse(plain) : plain));
      } return params.isJSON ? JSON.parse(data) : data;
    });
};

const deleteCache = async (redisKey) => redis.del(redisKey);

const makeKey = function (arr) {
  if (!Array.isArray(arr)) throw new Error('You have to enter parameter as an array to make redis key');

  arr.unshift(redisPrefix);
  return arr.join(':');
};

const publish = async (channel, msg) => redis.publish(channel, msg);

const subscribe = async (channel, callback, timeout = 0) => {
  const redis = new Redis(configVar.redis_uri);
  return new Promise((resolve, reject) => {
    let tm;
    if (timeout) {
      tm = setTimeout(async () => {
        redis.unsubscribe(channel);
        resolve();
      }, timeout);
    }

    redis.subscribe(channel, (err) => {
      if (err) {
        reject(err);
      }
    });

    redis.on('message', async (ch, msg) => {
      if (ch !== channel) {
        return;
      }
      await callback(msg);
      if (tm) clearTimeout(tm);
      redis.unsubscribe(channel);
      resolve();
    });
  });
};

module.exports = {
  redisInstance: redis,
  setCache,
  makeKey,
  getCache,
  publish,
  subscribe,
  cacheExecute,
  deleteCache,
};
