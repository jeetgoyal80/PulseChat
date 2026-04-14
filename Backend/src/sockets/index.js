const { Server } = require('socket.io');
const sessionConfig = require('../config/session');
const callHandler = require('./callHandler');
const messageHandler = require('./messageHandler');
const presenceHandler = require('./presenceHandler');

const frontendOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: frontendOrigins,
      credentials: true
    }
  });

  io.use((socket, next) => {
    sessionConfig(socket.request, {}, next);
  });

  io.use((socket, next) => {
    if (socket.request.session && socket.request.session.userId) {
      next();
    } else {
      next(new Error('Unauthorized: No session found'));
    }
  });

  const userSocketMap = new Map();

  const addUserSocket = (userId, socketId) => {
    const key = userId.toString();
    const sockets = userSocketMap.get(key) || new Set();
    sockets.add(socketId);
    userSocketMap.set(key, sockets);
  };

  const removeUserSocket = (userId, socketId) => {
    const key = userId.toString();
    const sockets = userSocketMap.get(key);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSocketMap.delete(key);
    }
  };

  const emitToUser = (userId, event, payload) => {
    const sockets = userSocketMap.get(userId.toString());
    if (!sockets?.size) return false;
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, payload);
    });
    return true;
  };

  io.on('connection', (socket) => {
    const userId = socket.request.session.userId;
    console.log(`User connected: ${userId}`);

    addUserSocket(userId, socket.id);
    socket.join(userId.toString());

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${userId} joined chat: ${chatId}`);
    });

    socket.on('typing_start', ({ chatId }) => {
      socket.emit('typing', { chatId, isTyping: true });
    });

    socket.on('typing_stop', ({ chatId }) => {
      socket.emit('typing', { chatId, isTyping: false });
    });

    messageHandler(io, socket);
    callHandler(io, socket, { emitToUser });
    presenceHandler(io, socket);

    socket.on('disconnect', () => {
      removeUserSocket(userId, socket.id);
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

module.exports = initSocket;
