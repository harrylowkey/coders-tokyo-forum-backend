const Redis = require("ioredis");
const { prefix } = require('../config/vars');

let connect = () => {
  return new Redis({
    port: 6379, // Redis port
    host: "127.0.0.1", // Redis host
    name: 'coders-tokyo-forum',
    password: "coderstokyo1705",
    db: 0
  });
}

let setCache = async function(params) {
  if (!params.key)
      throw new Error('missing key')
  if (params.value === undefined)
      throw new Error(`missing value to setCache (redis key: ${params.key})`)
  return params.ttl ? redis.set(params.key, value, 'EX', params.ttl) : redis.set(params.key, value)
}

let getCache = async function(params) {
  if (!params.key)
      throw new Error('missing key')

  return redis.get(params.key)
      .then(data => {
          if (!data)
              return
          return data
      })
}

let deleteCache = async(redisKey) => {
  return redis.del(redisKey)
}

let makeKey = function(arr) {
  if (!Array.isArray(arr))
      throw new Error('You have to enter parameter as an array to make redis key')

  arr.unshift(prefix)
  return arr.join(':')
}

module.exports = {
  connect,
  makeKey,
  setCache,
  getCache,
  deleteCache,
}