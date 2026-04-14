const presenceService = require('../services/presenceService');

module.exports = (io, socket) => {
  const userId = socket.request.session?.userId;
  if (!userId) return;

  const handleConnect = async () => {
    try {
      const user = await presenceService.setUserOnline(userId);

      if (user && user.privacy?.showOnlineStatus) {
        socket.broadcast.emit('user_status_change', {
          userId,
          isOnline: true
        });
      }
    } catch (error) {
      console.error('Presence Connect Error:', error);
    }
  };

  const broadcastTyping = async ({ chatId, isTyping }) => {
    try {
      const privacy = await presenceService.getUserPrivacy(userId);

      if (privacy?.showTypingIndicator !== false) {
        const payload = { chatId, userId, isTyping };
        socket.to(chatId).emit('display_typing', payload);
        socket.to(chatId).emit(isTyping ? 'typing_start' : 'typing_stop', payload);
      }
    } catch (error) {
      console.error('Typing Error:', error);
    }
  };

  handleConnect();

  socket.on('typing', broadcastTyping);
  socket.on('typing_start', ({ chatId }) => broadcastTyping({ chatId, isTyping: true }));
  socket.on('typing_stop', ({ chatId }) => broadcastTyping({ chatId, isTyping: false }));

  socket.on('disconnect', async () => {
    try {
      const user = await presenceService.setUserOffline(userId);

      if (user && (user.privacy?.showOnlineStatus || user.privacy?.showLastSeen)) {
        socket.broadcast.emit('user_status_change', {
          userId,
          isOnline: false,
          lastSeen: user.privacy?.showLastSeen ? user.lastSeen : null
        });
      }
      console.log(`User ${userId} went offline`);
    } catch (error) {
      console.error('Presence Disconnect Error:', error);
    }
  });
};
