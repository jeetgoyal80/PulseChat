const messageService = require('../services/messageService');
const Message = require('../models/Message'); // Needed for updating read status


module.exports = (io, socket) => {
  const userId = socket.request.session.userId;

  // 1. SEND MESSAGE (Now supports replies)
  socket.on('send_message', async (data) => {
    try {
      // ⚡ Extract replyToId from the incoming socket data
      const { chatId, content, replyToId } = data;

      const message = await messageService.sendMessage(chatId, userId, content, io, replyToId);

      // Emit to everyone in the chat room
      io.to(chatId).emit('new_message', message);
      
    } catch (error) {
      console.error("Message Error:", error);
      socket.emit('message_error', { message: error.message || "Failed to send message" });
    }
  });

  // 2. BLUE TICKS (Mark messages as seen)
  socket.on('mark_messages_seen', async ({ chatId }) => {
    try {
      // Find all messages in this chat sent BY THE OTHER PERSON that are not 'seen' yet
      const result = await Message.updateMany(
        { 
          chatId: chatId, 
          sender: { $ne: userId }, // Not sent by me
          status: { $ne: 'seen' }  // Not already seen
        },
        { $set: { status: 'seen' } }
      );

      // If we updated any messages, broadcast the blue ticks to the room
      if (result.modifiedCount > 0) {
        io.to(chatId).emit('messages_status_updated', {
          chatId: chatId,
          readerId: userId,
          status: 'seen'
        });
      }
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  });
};