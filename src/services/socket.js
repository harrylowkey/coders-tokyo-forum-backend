var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const configVar = require('@configVar');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const redisSub = new Redis()

let counter = 0;
const port = configVar.socket_port || 8888;

app.storage = {
  userIdAndSocketId: {},
  userIdAndNickname: {},
  socketIdAndUserId: {},
  connection: 0
};

let socketAuth = async (socket, token) => {
  token = token.replace('Bearer ', '');
  if (!token)
    return;
  let verify;
  let secretKey = configVar.jwt_secret || '';
  try {
    verify = jwt.verify(token, secretKey);
  } catch (e) {
    console.log("Verify err", e);
    return null;
  }
  if (verify) {
    let userId = verify.id;
    let userName = verify.username;
    let socketIds = app.storage.userIdAndSocketId[userId] || new Set();
    socketIds.add(socket.id);
    app.storage.userIdAndSocketId[userId] = socketIds;
    app.storage.socketIdAndUserId[socket.id] = userId;
  }
};

redisSub.subscribe(configVar.SOCKET_NEW_REPLY_COMMENT);
redisSub.subscribe(configVar.SOCKET_THREAD_NEW_REPLY_COMMENT)
redisSub.subscribe(configVar.SOCKET_DELETE_COMMENT);
redisSub.subscribe(configVar.SOCKET_LOAD_MORE_COMMENTS)
redisSub.subscribe(configVar.SOCKET_NEW_COMMENT);
redisSub.subscribe(configVar.SOCKET_EDIT_COMMENT)

redisSub.on('message', (channel, message) => {
  message = JSON.parse(message)
  console.log(message, channel + '_POST_ID_' + message.postId)
  io.emit(`${channel}_POST_ID_${message.postId}`, message)
});

let start = () => {
  io.on('connection', socket => {
    counter++;
    app.storage.connection = counter;

    console.log(`${counter} clients!`);
    io.emit(configVar.SOCKET_USER_CONNECTIONS, { connections: counter, online: Object.keys(app.storage.userIdAndSocketId).length });

    socket.on('auth', (token) => {
      if (!token) return
      socketAuth(socket, token);
      io.emit(configVar.SOCKET_USER_CONNECTIONS, { connections: counter, online: Object.keys(app.storage.userIdAndSocketId).length });
    });

    socket.on('pingServer', () => {
      io.emit('pingClient', 'PONG')
    })

    socket.on('disconnect', () => {
      counter--;
      app.storage.connection = counter;
      console.log(`${counter} clients!`);

      let userId = app.storage.socketIdAndUserId[socket.id];
      delete app.storage.socketIdAndUserId[socket.id];
      let socketIds = app.storage.userIdAndSocketId[userId] || new Set();
      socketIds.delete(socket.id);
      if (!socketIds.size)
        delete app.storage.userIdAndSocketId[userId];
      io.emit(configVar.SOCKET_USER_CONNECTIONS, { connections: counter, online: Object.keys(app.storage.userIdAndSocketId).length });
    });
  });

  http.listen(port);
  console.info(`Socket is running on port ${port}`);
};

module.exports = {
  start
};