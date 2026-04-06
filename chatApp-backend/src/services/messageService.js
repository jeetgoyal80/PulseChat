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

  const aiUser = await User.create({
    _id: AI_USER_ID,
    name: 'my.ai',
    email: 'my.ai@pulse.local',
    password: `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    isVerified: true,
    isOnline: true,
    isAI: true,
    bio: 'Always here to help.',
  });

  return aiUser;
};

const sendMessage = async (chatId, senderId, content, io, replyToId = null) => {
  const chat = await Chat.findById(chatId);
  
  // Enforce Blocking Logic for 1-on-1 chats
  if (chat.type === 'one-to-one') {
    const receiverId = chat.participants.find(p => p.toString() !== senderId.toString());
    const sender = await User.findById(senderId).select('blockedUsers');
    const receiver = await User.findById(receiverId).select('blockedUsers');

    if (sender.blockedUsers.includes(receiverId)) {
      throw new Error("You must unblock this user to send a message.");
    }
    if (receiver.blockedUsers.includes(senderId)) {
      throw new Error("Message failed to send. You have been blocked by this user.");
    }
  }
  
  let messageData = { 
    chatId, 
    sender: senderId, 
    content,
    replyTo: replyToId // ⚡ Save the ID of the replied message
  };

  if (chat.temporaryMode?.enabled) {
    messageData.isTemporary = true;
    messageData.expiresAt = new Date(Date.now() + chat.temporaryMode.expiryDuration * 1000);
  }

  let userMessage = await Message.create(messageData);

  // ⚡ Populate the replyTo field so the frontend has the original message context
  if (replyToId) {
    userMessage = await userMessage.populate('replyTo', 'content sender messageType');
  }

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

  const aiMessage = await Message.create({
    chatId,
    sender: aiUser._id,
    content: aiText,
    isTemporary: chat.temporaryMode?.enabled || false,
    expiresAt: chat.temporaryMode?.enabled ? new Date(Date.now() + chat.temporaryMode.expiryDuration * 1000) : null
  });

  chat.recentMessage = aiMessage._id;
  await chat.save();

  if (io) {
    io.to(chatId.toString()).emit('new_message', aiMessage);
  }
};

module.exports = { sendMessage, handleAIResponse };
