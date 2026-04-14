const messageService = require('../services/messageService');
const Message = require('../models/Message');

module.exports = (io, socket) => {
  const userId = socket.request.session.userId;

  socket.on('send_message', async (data) => {
    try {
      const { chatId, content, replyToId } = data;
      const message = await messageService.sendMessage(chatId, userId, content, io, replyToId);

      io.to(chatId).emit('new_message', message);
      io.to(chatId).emit('receive_message', message);
    } catch (error) {
      console.error('Message Error:', error);
      socket.emit('message_error', { message: error.message || 'Failed to send message' });
    }
  });

  const markSeen = async ({ chatId }) => {
    try {
      const result = await Message.updateMany(
        {
          chatId,
          sender: { $ne: userId },
          status: { $ne: 'seen' }
        },
        { $set: { status: 'seen' } }
      );

      if (result.modifiedCount > 0) {
        const payload = {
          chatId,
          readerId: userId,
          status: 'seen'
        };

        io.to(chatId).emit('messages_status_updated', payload);
        io.to(chatId).emit('message_seen', payload);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  socket.on('mark_messages_seen', markSeen);
  socket.on('message_seen', markSeen);
};
