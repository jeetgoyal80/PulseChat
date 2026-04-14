const Message = require('../models/Message');
const Chat = require('../models/Chat');
const aiService = require('./aiService');
const User = require('../models/User');

const AI_USER_ID = '000000000000000000000000';

const getOrCreateAIUser = async () => {
  const existing = await User.findById(AI_USER_ID);
  if (existing) {
    return existing;
  }

  return User.create({
    _id: AI_USER_ID,
    name: 'my.ai',
    email: 'my.ai@pulse.local',
    password: `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    isVerified: true,
    isOnline: true,
    isAI: true,
    bio: 'Always here to help.'
  });
};

const populateMessage = async (messageId) => (
  Message.findById(messageId)
    .populate('sender', 'name avatar isAI isOnline lastSeen privacy')
    .populate('replyTo', 'content sender messageType')
);

const emitMessageToChatParticipants = (io, chat, event, payload) => {
  if (!io || !chat) return;

  const chatId = chat._id?.toString?.() || chat.toString();
  io.to(chatId).emit(event, payload);

  (chat.participants || []).forEach((participantId) => {
    io.to(participantId.toString()).emit(event, payload);
  });
};

const sendMessage = async (chatId, senderId, content, io, replyToId = null) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  if (chat.type === 'one-to-one') {
    const receiverId = chat.participants.find((participant) => participant.toString() !== senderId.toString());
    const sender = await User.findById(senderId).select('blockedUsers');
    const receiver = await User.findById(receiverId).select('blockedUsers');

    if (sender?.blockedUsers?.includes(receiverId)) {
      throw new Error('You must unblock this user to send a message.');
    }

    if (receiver?.blockedUsers?.includes(senderId)) {
      throw new Error('Message failed to send. You have been blocked by this user.');
    }
  }

  const createdMessage = await Message.create({
    chatId,
    sender: senderId,
    content,
    replyTo: replyToId,
    isTemporary: Boolean(chat.temporaryMode?.enabled),
    expiresAt: chat.temporaryMode?.enabled
      ? new Date(Date.now() + chat.temporaryMode.expiryDuration * 1000)
      : null
  });

  const userMessage = await populateMessage(createdMessage._id);

  chat.recentMessage = userMessage._id;
  await chat.save();

  const isAiCommand = content.trim().toLowerCase().startsWith('/my.ai');
  if (chat.type === 'ai' || isAiCommand) {
    const prompt = isAiCommand ? content.replace(/^\/my\.ai/i, '').trim() : content;
    handleAIResponse(chatId, prompt, chat, io);
  }

  return userMessage;
};

const handleAIResponse = async (chatId, userPrompt, chat, io) => {
  const aiText = await aiService.generateAIResponse(userPrompt, chatId);
  const aiUser = await getOrCreateAIUser();

  const createdMessage = await Message.create({
    chatId,
    sender: aiUser._id,
    content: aiText,
    isTemporary: Boolean(chat.temporaryMode?.enabled),
    expiresAt: chat.temporaryMode?.enabled
      ? new Date(Date.now() + chat.temporaryMode.expiryDuration * 1000)
      : null
  });

  const aiMessage = await populateMessage(createdMessage._id);

  chat.recentMessage = aiMessage._id;
  await chat.save();

  if (io) {
    emitMessageToChatParticipants(io, chat, 'new_message', aiMessage);
    emitMessageToChatParticipants(io, chat, 'receive_message', aiMessage);
    emitMessageToChatParticipants(io, chat, 'ai_response', aiMessage);
  }
};

module.exports = { sendMessage, handleAIResponse, emitMessageToChatParticipants };
