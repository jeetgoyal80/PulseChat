const Message = require('../models/Message');
const Chat = require('../models/Chat');
const messageService = require('../services/messageService');
const cloudinary = require('cloudinary').v2;
const { getCloudinaryPublicId } = require('../utils/fileUtils');

exports.sendTextMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, replyToId } = req.body;
    const userId = req.session.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const io = req.app.get('io');
    const message = await messageService.sendMessage(chatId, userId, content.trim(), io, replyToId || null);

    if (io) {
      const chat = await Chat.findById(chatId).select('participants');
      messageService.emitMessageToChatParticipants(io, chat, 'new_message', message);
      messageService.emitMessageToChatParticipants(io, chat, 'receive_message', message);
    }

    res.status(201).json({ data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.session.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isImage = file.mimetype && file.mimetype.startsWith('image/');
    const isVideo = file.mimetype && file.mimetype.startsWith('video/');
    let type = 'document';

    if (isImage) type = 'media';
    if (isVideo) type = 'video';

    const message = await Message.create({
      chatId,
      sender: userId,
      content: file.originalname,
      messageType: type,
      mediaUrl: file.path,
      mediaFormat: file.mimetype || 'unknown',
      fileName: file.originalname,
      isTemporary: Boolean(chat.temporaryMode?.enabled),
      expiresAt: chat.temporaryMode?.enabled
        ? new Date(Date.now() + chat.temporaryMode.expiryDuration * 1000)
        : null
    });

    chat.recentMessage = message._id;
    await chat.save();

    const io = req.app.get('io');
    if (io) {
      messageService.emitMessageToChatParticipants(io, chat, 'new_message', message);
      messageService.emitMessageToChatParticipants(io, chat, 'receive_message', message);
    }

    res.status(201).json({ message: 'File uploaded successfully', data: message });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.session.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    if (message.mediaUrl) {
      const publicId = getCloudinaryPublicId(message.mediaUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Message.findByIdAndDelete(messageId);

    const chat = await Chat.findById(message.chatId);
    if (chat && chat.recentMessage?.toString() === messageId.toString()) {
      const previousMessage = await Message.findOne({ chatId: chat._id }).sort({ createdAt: -1 });
      chat.recentMessage = previousMessage ? previousMessage._id : null;
      await chat.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(message.chatId.toString()).emit('message_deleted', {
        messageId,
        chatId: message.chatId
      });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newContent } = req.body;
    const userId = req.session.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    if (message.messageType !== 'text') {
      return res.status(400).json({ message: 'Only text messages can be edited' });
    }

    message.content = newContent;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.chatId.toString()).emit('message_edited', {
        messageId,
        chatId: message.chatId,
        newContent
      });
    }

    res.status(200).json({ message: 'Message updated', data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .populate('sender', 'name avatar isAI')
      .populate('replyTo', 'content sender messageType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const validMessages = messages.filter((msg) => !msg.expiresAt || msg.expiresAt > new Date());

    res.status(200).json({
      messages: validMessages.reverse(),
      page,
      limit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
