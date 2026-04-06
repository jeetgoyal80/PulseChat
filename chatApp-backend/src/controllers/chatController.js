const Chat = require('../models/Chat');

// Create or fetch a 1-on-1 chat or AI chat
exports.accessChat = async (req, res) => {
  try {
    const { participantId, type } = req.body;
    const userId = req.session.userId;

    const participantList = type === 'ai' ? [userId] : [userId, participantId];

    let existingChat = await Chat.findOne({
      type: type,
      participants: { $all: participantList }
    }).populate('participants', '-password');

    if (existingChat) return res.status(200).json(existingChat);

    const newChat = await Chat.create({
      type: type,
      participants: participantList
    });

    const fullChat = await Chat.findById(newChat._id).populate('participants', '-password');
    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleTemporaryMode = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { enabled, duration } = req.body;
    const userId = req.session.userId;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    chat.temporaryMode = {
      enabled: enabled,
      expiryDuration: enabled ? duration : null,
      enabledAt: enabled ? Date.now() : null
    };

    await chat.save();

    const io = req.app.get('io');
    io.to(chatId).emit('temporary_mode_toggled', {
      chatId,
      temporaryMode: chat.temporaryMode,
      toggledBy: userId
    });

    res.status(200).json({ message: "Temporary mode updated", chat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createGroupChat = async (req, res) => {
  try {
    const { chatName, participants } = req.body;
    const userId = req.session.userId;

    if (!participants || participants.length < 2) {
      return res.status(400).json({ message: "More than 2 users are required to form a group chat" });
    }

    participants.push(userId);

    const groupChat = await Chat.create({
      chatName: chatName,
      participants: participants,
      type: 'group',
      groupAdmins: [userId]
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('participants', '-password')
      .populate('groupAdmins', '-password');

    const io = req.app.get('io');
    participants.forEach((participantId) => {
      if (participantId !== userId) {
        io.to(participantId.toString()).emit('added_to_group', fullGroupChat);
      }
    });

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addToGroup = async (req, res) => {
  try {
    const { chatId, userIdToAdd } = req.body;
    const requesterId = req.session.userId;

    const chat = await Chat.findById(chatId);

    if (!chat.groupAdmins.includes(requesterId)) {
      return res.status(403).json({ message: "Only admins can add users to this group" });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { participants: userIdToAdd } },
      { new: true }
    )
    .populate('participants', '-password')
    .populate('groupAdmins', '-password');

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeFromGroup = async (req, res) => {
  try {
    const { chatId, userIdToRemove } = req.body;
    const requesterId = req.session.userId;

    const chat = await Chat.findById(chatId);

    if (!chat.groupAdmins.includes(requesterId) && requesterId !== userIdToRemove) {
      return res.status(403).json({ message: "Only admins can remove users" });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { participants: userIdToRemove },
        $pull: { groupAdmins: userIdToRemove }
      },
      { new: true }
    )
    .populate('participants', '-password')
    .populate('groupAdmins', '-password');

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category } = req.query;

    let query = { participants: userId };

    const existingAiChat = await Chat.findOne({ type: 'ai', participants: userId });
    if (!existingAiChat) {
      await Chat.create({ type: 'ai', participants: [userId] });
    }

    if (category === 'groups') query.type = 'group';
    if (category === 'ai') query.type = 'ai';
    if (category === 'personal') query.type = 'one-to-one';

    let chats = await Chat.find(query)
      .populate('participants', 'name avatar isOnline lastSeen privacy')
      .populate('recentMessage')
      .sort({ updatedAt: -1 });

    if (category === 'unread') {
      chats = chats.filter(chat => {
        return chat.recentMessage &&
               chat.recentMessage.status !== 'seen' &&
               chat.recentMessage.sender.toString() !== userId.toString();
      });
    }

    res.status(200).json({ chats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
