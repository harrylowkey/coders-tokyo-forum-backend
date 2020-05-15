let Redis = require('ioredis')
let zlib = require('zlib')

let redis, redisPrefix

let compress = function (data) {
  var binary = zlib.gzipSync(data).toString('binary')
  return Promise.resolve(binary)
}

let decompress = function (data) {
  if (!data)
    throw new Error('Can not decompress null data')

  var d = zlib.unzipSync(new Buffer(data, 'binary')).toString()
  return Promise.resolve(d)
}

let cacheExecute = async function (params, func) {
  let key = params.key
  let isZip = params.isZip
  let isJSON = params.isJSON
  let ttl = params.ttl

  if (!key)
    throw new Error('missing key')

  return redis.get(key)
    .then(dataInCache => {
      if (!dataInCache)
        return func()
          .then(data => {
            return setCache({
              key: key,
              value: data,
              isJSON: isJSON,
              isZip: isZip,
              ttl: ttl,
            })
              .then(() => {
                return data
              })
          })
      else {
        if (isZip)
          return decompress(dataInCache)
            .then(plainText => {
              return isJSON ? JSON.parse(plainText) : plainText
            })
        else
          return isJSON === true ? JSON.parse(dataInCache) : dataInCache
      }
    })
}

let setCache = async function (params) {
  if (!params.key)
    throw new Error('missing key')
  if (params.value === undefined)
    throw new Error(`missing value to setCache (redis key: ${params.key})`)

  let value = params.isJSON ? JSON.stringify(params.value) : params.value

  if (params.isZip) {
    return compress(value)
      .then(ziped => {
        return params.ttl ? redis.set(params.key, ziped, 'EX', params.ttl) : redis.set(params.key, ziped)
      })
  } else
    return params.ttl ? redis.set(params.key, value, 'EX', params.ttl) : redis.set(params.key, value)
}

let getCache = async function (params) {
  if (!params.key)
    throw new Error('missing key')

  return redis.get(params.key)
    .then(data => {
      if (!data)
        return

      if (params.isZip) {
        return decompress(data)
          .then(plain => {
            return params.isJSON ? JSON.parse(plain) : plain
          })
      } else
        return params.isJSON ? JSON.parse(data) : data
    })
}

let deleteCache = async (redisKey) => {
  return redis.del(redisKey)
}

let makeKey = function (arr) {
  if (!Array.isArray(arr))
    throw new Error('You have to enter parameter as an array to make redis key')

  arr.unshift(redisPrefix)
  return arr.join(':')
}

let config = (params) => {
  redisPrefix = params.redisPrefix || 'tornomy'
  redis = new Redis({
    host: params.host,
    port: params.port,
    password: params.password,
  })
}

module.exports = {
  redis,
  config,
  setCache,
  makeKey,
  getCache,
  cacheExecute,
  deleteCache,
}
