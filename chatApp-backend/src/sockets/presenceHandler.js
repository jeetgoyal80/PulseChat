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
      console.error("Presence Connect Error:", error);
    }
  };

  handleConnect();

  socket.on('typing', async ({ chatId, isTyping }) => {
    try {
      const privacy = await presenceService.getUserPrivacy(userId);

      if (privacy?.showTypingIndicator !== false) {
        socket.to(chatId).emit('display_typing', { userId, isTyping });
      }
    } catch (error) {
      console.error("Typing Error:", error);
    }
  });

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
      console.error("Presence Disconnect Error:", error);
    }
  });
};
