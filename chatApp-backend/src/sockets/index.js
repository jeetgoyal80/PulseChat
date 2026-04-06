const { Server } = require('socket.io');
const sessionConfig = require('../config/session');
const callHandler = require('./callHandler'); // Correct
const messageHandler = require('./messageHandler');
const presenceHandler = require('./presenceHandler');

const frontendOrigin = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: frontendOrigin,
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
      next(new Error("Unauthorized: No session found"));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.request.session.userId;
    console.log(`User connected: ${userId}`);

    socket.join(userId.toString());

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`User ${userId} joined chat: ${chatId}`);
    });

    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('display_typing', { userId, isTyping });
    });

    messageHandler(io, socket);
    callHandler(io, socket);
    presenceHandler(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

module.exports = initSocket;
