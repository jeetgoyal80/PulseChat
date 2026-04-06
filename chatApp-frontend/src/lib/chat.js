export const AI_SENDER_ID = '000000000000000000000000'

const AI_USER = {
  id: AI_SENDER_ID,
  name: 'my.ai',
  avatar: '',
  isOnline: true,
  isAI: true,
}

export function getEntityId(entity) {
  if (!entity) {
    return ''
  }

  if (typeof entity === 'string') {
    return entity
  }

  return String(entity._id ?? entity.id ?? entity)
}

export function getInitials(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'
}

export function normalizeParticipant(participant) {
  if (!participant) {
    return null
  }

  if (typeof participant === 'string') {
    return { id: participant }
  }

  return {
    ...participant,
    id: getEntityId(participant),
  }
}

function resolveSender(senderId, senderValue, chat, currentUserId) {
  if (senderId === AI_SENDER_ID) {
    return AI_USER
  }

  const participantMatch = chat?.participants?.find((participant) => participant.id === senderId)
  const normalizedSender =
    senderValue && typeof senderValue === 'object' ? normalizeParticipant(senderValue) : null

  return {
    ...(participantMatch ?? {}),
    ...(normalizedSender ?? {}),
    id: senderId,
    name:
      normalizedSender?.name ??
      participantMatch?.name ??
      (senderId === currentUserId ? 'You' : 'Unknown user'),
  }
}

function normalizeReply(replyTo, chat, currentUserId) {
  if (!replyTo) {
    return null
  }

  const senderId = getEntityId(replyTo.sender)
  const sender = resolveSender(senderId, replyTo.sender, chat, currentUserId)

  return {
    ...replyTo,
    id: getEntityId(replyTo),
    senderId,
    senderName: sender?.name ?? 'Reply',
    messageType: replyTo.messageType ?? 'text',
  }
}

export function normalizeMessage(message, options = {}) {
  if (!message) {
    return null
  }

  const { chat, currentUserId } = options
  const senderId = getEntityId(message.sender)
  const sender = resolveSender(senderId, message.sender, chat, currentUserId)

  return {
    ...message,
    id: getEntityId(message),
    chatId: getEntityId(message.chatId),
    createdAt: message.createdAt ?? new Date().toISOString(),
    updatedAt: message.updatedAt ?? message.createdAt ?? new Date().toISOString(),
    senderId,
    sender,
    isMine: senderId === currentUserId,
    messageType: message.messageType ?? 'text',
    status: message.status ?? 'sent',
    replyTo: normalizeReply(message.replyTo, chat, currentUserId),
  }
}

export function normalizeChat(chat, currentUserId) {
  const participants = (chat?.participants ?? []).map(normalizeParticipant).filter(Boolean)

  const normalizedChat = {
    ...chat,
    id: getEntityId(chat),
    participants,
    groupAdmins: (chat?.groupAdmins ?? []).map(normalizeParticipant).filter(Boolean),
    temporaryMode: chat?.temporaryMode ?? {
      enabled: false,
      expiryDuration: null,
      enabledAt: null,
    },
    updatedAt: chat?.updatedAt ?? chat?.createdAt ?? new Date().toISOString(),
  }

  return {
    ...normalizedChat,
    recentMessage: normalizeMessage(chat?.recentMessage, {
      chat: normalizedChat,
      currentUserId,
    }),
  }
}

export function sortChats(chats) {
  return [...chats].sort((left, right) => {
    const rightDate = new Date(right.updatedAt ?? right.recentMessage?.createdAt ?? 0).getTime()
    const leftDate = new Date(left.updatedAt ?? left.recentMessage?.createdAt ?? 0).getTime()
    return rightDate - leftDate
  })
}

export function mergeChats(existingChats, incomingChats, currentUserId) {
  const chatMap = new Map(existingChats.map((chat) => [chat.id, chat]))

  incomingChats
    .map((chat) => normalizeChat(chat, currentUserId))
    .forEach((chat) => {
      const previous = chatMap.get(chat.id)

      chatMap.set(chat.id, {
        ...previous,
        ...chat,
        participants: chat.participants?.length ? chat.participants : previous?.participants ?? [],
        groupAdmins: chat.groupAdmins?.length ? chat.groupAdmins : previous?.groupAdmins ?? [],
        recentMessage: chat.recentMessage ?? previous?.recentMessage ?? null,
        temporaryMode: chat.temporaryMode ?? previous?.temporaryMode ?? { enabled: false },
      })
    })

  return sortChats([...chatMap.values()])
}

export function getChatIdentity(chat, currentUserId) {
  if (!chat) {
    return {
      title: 'Conversation',
      subtitle: 'Select a chat to begin',
      avatarLabel: 'C',
      tone: 'direct',
      status: 'idle',
      online: false,
    }
  }

  if (chat.type === 'ai') {
    return {
      title: 'my.ai',
      subtitle: 'Always available',
      avatarLabel: 'AI',
      tone: 'ai',
      status: 'online',
      online: true,
    }
  }

  if (chat.type === 'group') {
    const others = (chat.participants ?? []).filter((participant) => participant.id !== currentUserId)
    const memberCount = others.length + 1

    return {
      title:
        chat.chatName?.trim() ||
        others.map((participant) => participant.name).filter(Boolean).join(', ') ||
        'Group chat',
      subtitle: `${memberCount} members`,
      avatarLabel: getInitials(chat.chatName || 'Group'),
      tone: 'group',
      status: 'group',
      online: false,
    }
  }

  const directParticipant =
    (chat.participants ?? []).find((participant) => participant.id !== currentUserId) ??
    chat.participants?.[0]

  const hasLastSeen = Boolean(directParticipant?.lastSeen)

  return {
    title: directParticipant?.name || 'Direct message',
    subtitle: directParticipant?.isOnline
      ? 'Online'
      : hasLastSeen
        ? `Last seen ${formatRelativeTime(directParticipant.lastSeen)}`
        : 'Offline',
    avatarLabel: getInitials(directParticipant?.name || 'DM'),
    tone: 'direct',
    status: directParticipant?.isOnline ? 'online' : 'offline',
    online: Boolean(directParticipant?.isOnline),
    participant: directParticipant,
  }
}

export function getRecentMessagePreview(chat, currentUserId) {
  if (!chat?.recentMessage) {
    return 'No messages yet'
  }

  const message = chat.recentMessage
  const prefix = message.senderId === currentUserId && chat.type !== 'ai' ? 'You: ' : ''

  if (message.messageType === 'media') {
    return `${prefix}Shared an image`
  }

  if (message.messageType === 'video') {
    return `${prefix}Shared a video`
  }

  if (message.messageType === 'document') {
    return `${prefix}${message.fileName || 'Shared a file'}`
  }

  if (message.messageType === 'call_log') {
    return `${prefix}Call activity`
  }

  return `${prefix}${message.content}`
}

export function chatHasUnread(chat, currentUserId) {
  return Boolean(
    chat?.recentMessage &&
      chat.recentMessage.senderId !== currentUserId &&
      chat.recentMessage.status !== 'seen'
  )
}

export function filterChatsByCategory(chats, category, currentUserId) {
  switch (category) {
    case 'unread':
      return chats.filter((chat) => chatHasUnread(chat, currentUserId))
    case 'groups':
      return chats.filter((chat) => chat.type === 'group')
    case 'ai':
      return chats.filter((chat) => chat.type === 'ai')
    case 'personal':
      return chats.filter((chat) => chat.type === 'one-to-one')
    default:
      return chats
  }
}

export function matchesChatSearch(chat, term, currentUserId) {
  if (!term) {
    return true
  }

  const value = term.trim().toLowerCase()

  if (!value) {
    return true
  }

  const identity = getChatIdentity(chat, currentUserId)
  const preview = getRecentMessagePreview(chat, currentUserId)
  const haystack = [identity.title, identity.subtitle, preview]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(value)
}

export function upsertMessage(messages, nextMessage) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id)

  if (existingIndex === -1) {
    return [...messages, nextMessage].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
  }

  const nextMessages = [...messages]
  nextMessages[existingIndex] = {
    ...nextMessages[existingIndex],
    ...nextMessage,
  }

  return nextMessages
}

export function updateChatPresence(chats, payload) {
  return chats.map((chat) => ({
    ...chat,
    participants: (chat.participants ?? []).map((participant) =>
      participant.id === payload.userId
        ? {
            ...participant,
            isOnline: payload.isOnline,
            lastSeen: payload.lastSeen ?? participant.lastSeen,
          }
        : participant
    ),
  }))
}

export function formatSidebarTimestamp(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()

  if (sameDay) {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatMessageTimestamp(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatRelativeTime(value) {
  const target = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes <= 1) {
    return 'just now'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}
