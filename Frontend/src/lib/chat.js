import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns';

export const AI_USER_ID = '000000000000000000000000';

export const formatChatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (isToday(date)) return format(date, 'p');
  if (isYesterday(date)) return 'Yesterday';
  return formatDistanceToNowStrict(date, { addSuffix: true });
};

export const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'p');
};

export const normalizeChat = (chat, currentUserId, unreadCount = 0, typingUserId = null) => {
  const participants = chat.participants || [];
  const isGroup = chat.type === 'group';
  const isAI = chat.type === 'ai';
  const otherParticipants = participants.filter((participant) => String(participant._id) !== String(currentUserId));
  const primaryContact = isGroup
    ? {
        _id: chat._id,
        name: chat.chatName || otherParticipants.map((participant) => participant.name).join(', ') || 'Group Chat',
        status: 'online',
        about: `${participants.length} members`,
      }
    : otherParticipants[0] || {
        _id: AI_USER_ID,
        name: 'my.ai',
        isAI: true,
        isOnline: true,
        bio: 'Always here to help.',
      };

  const recentMessage = chat.recentMessage;
  const recentContent = recentMessage?.content || (isAI ? 'Start a conversation with my.ai' : 'No messages yet');

  return {
    ...chat,
    id: chat._id,
    contact: {
      id: primaryContact._id,
      name: primaryContact.name,
      status: primaryContact.isOnline ? 'online' : 'offline',
      lastSeen: primaryContact.lastSeen ? formatChatTime(primaryContact.lastSeen) : '',
      about: primaryContact.bio || primaryContact.about || '',
      isAI: Boolean(primaryContact.isAI),
      isOnline: Boolean(primaryContact.isOnline),
    },
    isGroup,
    isAI,
    lastMessage: recentContent,
    lastMessageTime: recentMessage?.createdAt ? formatChatTime(recentMessage.createdAt) : '',
    unreadCount,
    typing: Boolean(typingUserId),
    typingUserId,
    temporaryChat: chat.temporaryMode?.enabled
      ? {
          enabled: true,
          duration: chat.temporaryMode.expiryDuration,
          enabledAt: chat.temporaryMode.enabledAt,
        }
      : null,
    groupMembers: participants.map((participant) => ({
      id: participant._id,
      name: participant.name,
      status: participant.isOnline ? 'online' : 'offline',
    })),
  };
};

export const normalizeMessage = (message, currentUserId) => {
  const senderId = typeof message.sender === 'object' ? message.sender?._id : message.sender;
  const isAIMessage = senderId === AI_USER_ID || message.sender?.isAI;
  const typeMap = {
    text: isAIMessage ? 'ai-response' : 'text',
    media: 'image',
    document: 'file',
    video: 'file',
    call_log: 'system',
  };

  return {
    ...message,
    id: message._id || message.id,
    senderId: String(senderId),
    chatId: message.chatId?._id || message.chatId,
    type: typeMap[message.messageType] || (isAIMessage ? 'ai-response' : 'text'),
    timestamp: formatMessageTime(message.createdAt || message.timestamp),
    status: message.status === 'seen' ? 'read' : message.status || 'sent',
    isMe: String(senderId) === String(currentUserId),
    createdAt: message.createdAt || message.timestamp,
    optimistic: Boolean(message.optimistic),
    fileName: message.fileName,
    imageUrl: message.mediaUrl,
    replyTo: message.replyTo,
  };
};

export const upsertMessageList = (messages, incomingMessage, currentUserId) => {
  const normalized = normalizeMessage(incomingMessage, currentUserId);
  const existingIndex = messages.findIndex((message) => message.id === normalized.id);

  if (existingIndex >= 0) {
    const next = [...messages];
    next[existingIndex] = { ...next[existingIndex], ...normalized, optimistic: false };
    return next.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  }

  const optimisticIndex = messages.findIndex((message) => (
    message.optimistic &&
    String(message.senderId) === String(normalized.senderId) &&
    message.content === normalized.content
  ));

  if (optimisticIndex >= 0) {
    const next = [...messages];
    next[optimisticIndex] = { ...next[optimisticIndex], ...normalized, optimistic: false };
    return next.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
  }

  return [...messages, normalized].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
};
