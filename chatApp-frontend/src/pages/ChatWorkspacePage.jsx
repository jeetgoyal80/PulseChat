import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Info,
  ImagePlus,
  LogOut,
  Lock,
  Paperclip,
  Phone,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Sparkles,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'

import { CallModal } from '@/components/chat/CallModal'
import { ChatAvatar } from '@/components/chat/ChatAvatar'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { NewChatDialog } from '@/components/chat/NewChatDialog'
import { SettingsDialog } from '@/components/chat/SettingsDialog'
import { SidebarChatItem } from '@/components/chat/SidebarChatItem'
import { PulseLogo } from '@/components/PulseLogo'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import api, { getErrorMessage } from '@/lib/api'
import {
  filterChatsByCategory,
  getChatIdentity,
  getEntityId,
  getInitials,
  matchesChatSearch,
  mergeChats,
  normalizeMessage,
  sortChats,
  updateChatPresence,
  upsertMessage,
} from '@/lib/chat'
import { useSocket } from '@/lib/socket'

const chatCategories = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
  { id: 'ai', label: 'AI' },
  { id: 'personal', label: 'Direct' },
]

const aiActionChips = [
  {
    label: 'Summarize',
    description: 'Condense the thread into key points.',
    prompt: 'Summarize this chat for me.',
  },
  {
    label: 'Plan my day',
    description: 'Turn the conversation into an action plan.',
    prompt: 'Plan my day based on this conversation.',
  },
  {
    label: 'Translate',
    description: 'Translate the latest message into simple English.',
    prompt: 'Translate the latest message for me.',
  },
]

export function ChatWorkspacePage() {
  const { logout, user } = useAuth()
  const { isConnected, socket, socketError } = useSocket()

  const [allChats, setAllChats] = useState([])
  const [messagesByChat, setMessagesByChat] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeChatId, setActiveChatId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [draft, setDraft] = useState('')
  const [typingState, setTypingState] = useState(null)
  const [chatError, setChatError] = useState('')
  const [sendError, setSendError] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [loadingUserSearch, setLoadingUserSearch] = useState(false)
  const [newChatError, setNewChatError] = useState('')
  const [privacySettings, setPrivacySettings] = useState({
    showLastSeen: true,
    showOnlineStatus: true,
    showTypingIndicator: true,
  })
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false)
  const [blockingInProgress, setBlockingInProgress] = useState(false)
  const [callState, setCallState] = useState({
    open: false,
    phase: 'calling',
    type: 'voice',
    peer: null,
    callId: null,
    muted: false,
    cameraDisabled: false,
    screenSharing: false,
    error: '',
  })
  const [loadingChats, setLoadingChats] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const deferredSearch = useDeferredValue(searchTerm)
  const deferredUserSearch = useDeferredValue(userSearchTerm)
  const joinedRoomsRef = useRef(new Set())
  const typingTimeoutRef = useRef(null)
  const activeChatIdRef = useRef(activeChatId)
  const allChatsRef = useRef(allChats)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    activeChatIdRef.current = activeChatId
  }, [activeChatId])

  useEffect(() => {
    allChatsRef.current = allChats
  }, [allChats])

  useEffect(() => {
    return () => {
      if (selectedMedia?.previewUrl) {
        window.URL.revokeObjectURL(selectedMedia.previewUrl)
      }
    }
  }, [selectedMedia])

  const activeChat = useMemo(
    () => allChats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, allChats]
  )
  const aiChat = useMemo(() => allChats.find((chat) => chat.type === 'ai') ?? null, [allChats])

  const visibleChats = useMemo(() => {
    const byCategory = filterChatsByCategory(allChats, activeCategory, user.id)
    return byCategory.filter((chat) => matchesChatSearch(chat, deferredSearch, user.id))
  }, [activeCategory, allChats, deferredSearch, user.id])

  const activeMessages = messagesByChat[activeChatId] ?? []
  const activeIdentity = useMemo(
    () => getChatIdentity(activeChat, user.id),
    [activeChat, user.id]
  )
  const isTemporaryChat = Boolean(activeChat?.temporaryMode?.enabled)
  const activeDirectParticipant = activeIdentity.participant ?? null
  const derivedCurrentUserPrivacy = useMemo(() => {
    for (const chat of allChats) {
      const participant = chat.participants?.find((person) => person.id === user.id)
      if (participant?.privacy) {
        return participant.privacy
      }
    }

    return null
  }, [allChats, user.id])

  useEffect(() => {
    if (derivedCurrentUserPrivacy) {
      setPrivacySettings((current) => ({
        ...current,
        ...derivedCurrentUserPrivacy,
      }))
    }
  }, [derivedCurrentUserPrivacy])

  const refreshChats = useCallback(
    async (category = 'all') => {
      setLoadingChats(true)
      setChatError('')

      try {
        const response = await api.get('/chats', {
          params: category === 'all' ? undefined : { category },
        })

        setAllChats((current) => mergeChats(current, response.data.chats ?? [], user.id))
      } catch (error) {
        setChatError(getErrorMessage(error, 'Unable to load your chats right now.'))
      } finally {
        setLoadingChats(false)
      }
    },
    [user.id]
  )

  const loadMessages = useCallback(
    async (chatId) => {
      setLoadingMessages(true)
      setSendError('')

      try {
        const response = await api.get(`/messages/${chatId}`)
        const sourceChat = allChatsRef.current.find((chat) => chat.id === chatId)
        const normalizedMessages = (response.data.messages ?? []).map((message) =>
          normalizeMessage(message, {
            chat: sourceChat,
            currentUserId: user.id,
          })
        )

        setMessagesByChat((current) => ({
          ...current,
          [chatId]: normalizedMessages,
        }))
      } catch (error) {
        setSendError(getErrorMessage(error, 'Unable to load messages for this chat.'))
      } finally {
        setLoadingMessages(false)
      }
    },
    [user.id]
  )

  const loadBlockedUsers = useCallback(async () => {
    setLoadingBlockedUsers(true)
    setSettingsError('')

    try {
      const response = await api.get('/users/blocked')
      setBlockedUsers(
        (response.data.blockedUsers ?? []).map((person) => ({
          ...person,
          id: getEntityId(person),
          initials: getInitials(person.name),
        }))
      )
    } catch (error) {
      setSettingsError(getErrorMessage(error, 'Unable to load blocked users right now.'))
    } finally {
      setLoadingBlockedUsers(false)
    }
  }, [])

  const searchUsers = useCallback(async (term = '') => {
    setLoadingUserSearch(true)
    setSettingsError('')

    try {
      const response = await api.get('/users', {
        params: term.trim() ? { search: term.trim() } : undefined,
      })

      setUserSearchResults(
        (response.data ?? []).map((person) => ({
          ...person,
          id: getEntityId(person),
          initials: getInitials(person.name),
        }))
      )
    } catch (error) {
      setSettingsError(getErrorMessage(error, 'Unable to search for users right now.'))
    } finally {
      setLoadingUserSearch(false)
    }
  }, [])

  useEffect(() => {
    refreshChats(activeCategory)
  }, [activeCategory, refreshChats])

  useEffect(() => {
    if (newChatOpen) {
      searchUsers(deferredUserSearch)
    }
  }, [deferredUserSearch, newChatOpen, searchUsers])

  useEffect(() => {
    if (settingsOpen) {
      loadBlockedUsers()
    }
  }, [loadBlockedUsers, settingsOpen])

  useEffect(() => {
    if (visibleChats.length === 0) {
      setActiveChatId(null)
      return
    }

    if (!visibleChats.some((chat) => chat.id === activeChatId)) {
      setActiveChatId(visibleChats[0].id)
    }
  }, [activeChatId, visibleChats])

  useEffect(() => {
    if (!activeChatId || messagesByChat[activeChatId]) {
      return
    }

    loadMessages(activeChatId)
  }, [activeChatId, loadMessages, messagesByChat])

  useEffect(() => {
    if (!isConnected) {
      joinedRoomsRef.current.clear()
      return
    }

    allChats.forEach((chat) => {
      if (!joinedRoomsRef.current.has(chat.id)) {
        socket.emit('join_chat', chat.id)
        joinedRoomsRef.current.add(chat.id)
      }
    })
  }, [allChats, isConnected, socket])

  useEffect(() => {
    if (!activeChatId || !socket) {
      return
    }

    setTypingState(null)
    setSelectedMedia((current) => {
      if (current?.previewUrl) {
        window.URL.revokeObjectURL(current.previewUrl)
      }
      return null
    })
    socket.emit('mark_messages_seen', { chatId: activeChatId })
  }, [activeChatId, socket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeMessages.length, activeChatId, typingState])

  useEffect(() => {
    if (!socket) {
      return undefined
    }

    const handleNewMessage = (rawMessage) => {
      const chatId = getEntityId(rawMessage.chatId)
      const sourceChat = allChatsRef.current.find((chat) => chat.id === chatId)
      const normalizedMessage = normalizeMessage(rawMessage, {
        chat: sourceChat,
        currentUserId: user.id,
      })

      setMessagesByChat((current) => ({
        ...current,
        [chatId]: upsertMessage(current[chatId] ?? [], normalizedMessage),
      }))

      setAllChats((current) => {
        const existingChat = current.find((chat) => chat.id === chatId)
        if (!existingChat) {
          return current
        }

        return sortChats(
          current.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  recentMessage: normalizedMessage,
                  updatedAt: normalizedMessage.createdAt,
                }
              : chat
          )
        )
      })

      if (chatId === activeChatIdRef.current && normalizedMessage.senderId !== user.id) {
        socket.emit('mark_messages_seen', { chatId })
      }
    }

    const handleMessageStatusUpdated = ({ chatId, readerId, status }) => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] ?? []).map((message) =>
          message.isMine && readerId !== user.id ? { ...message, status } : message
        ),
      }))
    }

    const handleDisplayTyping = ({ userId: typingUserId, isTyping }) => {
      const currentChatId = activeChatIdRef.current
      const currentChat = allChatsRef.current.find((chat) => chat.id === currentChatId)

      if (!currentChat || currentChat.type === 'group') {
        return
      }

      const currentParticipant = getChatIdentity(currentChat, user.id).participant

      if (!currentParticipant || currentParticipant.id !== typingUserId) {
        return
      }

      setTypingState(
        isTyping
          ? {
              userId: typingUserId,
              name: currentParticipant.name,
            }
          : null
      )
    }

    const handleUserStatusChange = (payload) => {
      setAllChats((current) => updateChatPresence(current, payload))
    }

    const handleMessageEdited = ({ messageId, chatId, newContent }) => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] ?? []).map((message) =>
          message.id === messageId ? { ...message, content: newContent } : message
        ),
      }))

      setAllChats((current) =>
        current.map((chat) =>
          chat.id === chatId && chat.recentMessage?.id === messageId
            ? {
                ...chat,
                recentMessage: {
                  ...chat.recentMessage,
                  content: newContent,
                },
              }
            : chat
        )
      )
    }

    const handleMessageDeleted = ({ messageId, chatId }) => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] ?? []).filter((message) => message.id !== messageId),
      }))
    }

    const handleTemporaryModeToggled = ({ chatId, temporaryMode }) => {
      setAllChats((current) =>
        current.map((chat) => (chat.id === chatId ? { ...chat, temporaryMode } : chat))
      )
    }

    const handleMessageError = ({ message }) => {
      setSendError(message || 'Unable to send your message.')
    }

    const handleIncomingCall = ({ callId, from, name, type }) => {
      setCallState({
        open: true,
        phase: 'incoming',
        type: type || 'voice',
        peer: {
          id: from,
          name: name || 'Pulse contact',
          avatarLabel: getInitials(name || 'PC'),
          tone: 'direct',
        },
        callId,
        muted: false,
        cameraDisabled: false,
        screenSharing: false,
        error: '',
      })
    }

    const handleCallAccepted = () => {
      setCallState((current) => ({
        ...current,
        open: true,
        phase: 'active',
        error: '',
      }))
    }

    const handleCallEnded = () => {
      setCallState((current) => ({
        ...current,
        phase: 'ended',
        error: '',
      }))

      window.setTimeout(() => {
        setCallState((current) => ({
          ...current,
          open: false,
        }))
      }, 900)
    }

    const handleCallError = ({ message }) => {
      setCallState((current) => ({
        ...current,
        open: true,
        error: message || 'Call could not be completed.',
      }))
    }

    socket.on('new_message', handleNewMessage)
    socket.on('messages_status_updated', handleMessageStatusUpdated)
    socket.on('display_typing', handleDisplayTyping)
    socket.on('user_status_change', handleUserStatusChange)
    socket.on('message_edited', handleMessageEdited)
    socket.on('message_deleted', handleMessageDeleted)
    socket.on('temporary_mode_toggled', handleTemporaryModeToggled)
    socket.on('message_error', handleMessageError)
    socket.on('incoming_call', handleIncomingCall)
    socket.on('call_accepted', handleCallAccepted)
    socket.on('call_ended', handleCallEnded)
    socket.on('call_error', handleCallError)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('messages_status_updated', handleMessageStatusUpdated)
      socket.off('display_typing', handleDisplayTyping)
      socket.off('user_status_change', handleUserStatusChange)
      socket.off('message_edited', handleMessageEdited)
      socket.off('message_deleted', handleMessageDeleted)
      socket.off('temporary_mode_toggled', handleTemporaryModeToggled)
      socket.off('message_error', handleMessageError)
      socket.off('incoming_call', handleIncomingCall)
      socket.off('call_accepted', handleCallAccepted)
      socket.off('call_ended', handleCallEnded)
      socket.off('call_error', handleCallError)
    }
  }, [socket, user.id])

  const sendMessage = useCallback(
    (contentOverride) => {
      if (!activeChatId || !socket) {
        return
      }

      const content = (contentOverride ?? draft).trim()
      if (!content) {
        return
      }

      setSendError('')
      socket.emit('send_message', {
        chatId: activeChatId,
        content,
        replyToId: null,
      })

      socket.emit('typing', {
        chatId: activeChatId,
        isTyping: false,
      })

      if (!contentOverride) {
        setDraft('')
      }

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    },
    [activeChatId, draft, socket]
  )

  const clearSelectedMedia = useCallback(() => {
    setSelectedMedia((current) => {
      if (current?.previewUrl) {
        window.URL.revokeObjectURL(current.previewUrl)
      }

      return null
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleMediaSelection = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setSendError('')
    setSelectedMedia((current) => {
      if (current?.previewUrl) {
        window.URL.revokeObjectURL(current.previewUrl)
      }

      const previewable = file.type.startsWith('image/') || file.type.startsWith('video/')

      return {
        file,
        previewUrl: previewable ? window.URL.createObjectURL(file) : '',
        kind: file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('video/')
            ? 'video'
            : 'document',
      }
    })
  }

  const handleUploadMedia = useCallback(async () => {
    if (!activeChatId || !selectedMedia?.file) {
      return
    }

    setUploadingMedia(true)
    setSendError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedMedia.file)

      await api.post(`/messages/${activeChatId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      clearSelectedMedia()
    } catch (error) {
      setSendError(getErrorMessage(error, 'Unable to upload that file right now.'))
    } finally {
      setUploadingMedia(false)
    }
  }, [activeChatId, clearSelectedMedia, selectedMedia?.file])

  const handleSelectUserForChat = useCallback(
    async (person) => {
      setNewChatError('')

      try {
        const response = await api.post('/chats', {
          participantId: person.id,
          type: 'one-to-one',
        })

        const createdChat = mergeChats(allChatsRef.current, [response.data], user.id)
        setAllChats(createdChat)
        setActiveCategory('all')
        setActiveChatId(getEntityId(response.data))
        setNewChatOpen(false)
      } catch (error) {
        setNewChatError(getErrorMessage(error, 'Unable to create that conversation right now.'))
      }
    },
    [user.id]
  )

  const handleSelectAiChat = useCallback(async () => {
    setNewChatError('')

    if (aiChat) {
      setActiveCategory('ai')
      setActiveChatId(aiChat.id)
      setNewChatOpen(false)
      return
    }

    try {
      const response = await api.post('/chats', {
        participantId: user.id,
        type: 'ai',
      })

      const createdChat = mergeChats(allChatsRef.current, [response.data], user.id)
      setAllChats(createdChat)
      setActiveCategory('ai')
      setActiveChatId(getEntityId(response.data))
      setNewChatOpen(false)
    } catch (error) {
      setNewChatError(getErrorMessage(error, 'Unable to start your AI conversation right now.'))
    }
  }, [aiChat, user.id])

  const handleTogglePrivacy = useCallback(async (key, checked) => {
    setSavingPrivacy(true)
    setSettingsError('')
    setPrivacySettings((current) => ({
      ...current,
      [key]: checked,
    }))

    try {
      await api.put('/users/settings/privacy', {
        [key]: checked,
      })

      setAllChats((current) =>
        current.map((chat) => ({
          ...chat,
          participants: (chat.participants ?? []).map((person) =>
            person.id === user.id
              ? {
                  ...person,
                  privacy: {
                    ...(person.privacy ?? {}),
                    [key]: checked,
                  },
                }
              : person
          ),
        }))
      )
    } catch (error) {
      setSettingsError(getErrorMessage(error, 'Unable to update privacy right now.'))
      setPrivacySettings((current) => ({
        ...current,
        [key]: !checked,
      }))
    } finally {
      setSavingPrivacy(false)
    }
  }, [user.id])

  const handleToggleBlock = useCallback(async () => {
    if (!activeDirectParticipant) {
      return
    }

    const currentlyBlocked = blockedUsers.some((person) => person.id === activeDirectParticipant.id)
    setBlockingInProgress(true)
    setSettingsError('')

    try {
      if (currentlyBlocked) {
        await api.put('/users/unblock', {
          userToUnblockId: activeDirectParticipant.id,
        })
        setBlockedUsers((current) =>
          current.filter((person) => person.id !== activeDirectParticipant.id)
        )
      } else {
        await api.put('/users/block', {
          userToBlockId: activeDirectParticipant.id,
        })
        setBlockedUsers((current) => [
          ...current,
          {
            ...activeDirectParticipant,
            initials: getInitials(activeDirectParticipant.name),
          },
        ])
      }
    } catch (error) {
      setSettingsError(getErrorMessage(error, 'Unable to update block settings right now.'))
    } finally {
      setBlockingInProgress(false)
    }
  }, [activeDirectParticipant, blockedUsers])

  const startCall = useCallback(
    (type) => {
      if (!socket || !activeDirectParticipant) {
        return
      }

      const nextCallState = {
        open: true,
        phase: 'calling',
        type,
        peer: {
          id: activeDirectParticipant.id,
          name: activeDirectParticipant.name,
          avatarLabel: getInitials(activeDirectParticipant.name),
          tone: 'direct',
        },
        callId: null,
        muted: false,
        cameraDisabled: false,
        screenSharing: false,
        error: '',
      }

      setCallState(nextCallState)
      socket.emit('call_user', {
        userToCall: activeDirectParticipant.id,
        signalData: { initiatedAt: Date.now(), type },
        from: user.id,
        name: user.name,
        type,
      })
    },
    [activeDirectParticipant, socket, user.id, user.name]
  )

  const handleAcceptCall = useCallback(() => {
    if (!socket || !callState.peer?.id || !callState.callId) {
      return
    }

    socket.emit('answer_call', {
      callId: callState.callId,
      to: callState.peer.id,
      signal: { acceptedAt: Date.now() },
    })

    setCallState((current) => ({
      ...current,
      phase: 'active',
    }))
  }, [callState.callId, callState.peer?.id, socket])

  const handleDeclineCall = useCallback(() => {
    if (socket && callState.peer?.id && callState.callId) {
      socket.emit('end_call', {
        to: callState.peer.id,
        callId: callState.callId,
        reason: 'rejected',
      })
    }

    setCallState((current) => ({
      ...current,
      open: false,
      phase: 'ended',
    }))
  }, [callState.callId, callState.peer?.id, socket])

  const handleEndCall = useCallback(() => {
    if (socket && callState.peer?.id && callState.callId) {
      socket.emit('end_call', {
        to: callState.peer.id,
        callId: callState.callId,
        reason: 'ended',
      })
    }

    setCallState((current) => ({
      ...current,
      open: false,
      phase: 'ended',
    }))
  }, [callState.callId, callState.peer?.id, socket])

  const handleCloseCallModal = useCallback(() => {
    setCallState((current) => ({
      ...current,
      open: false,
    }))
  }, [])

  const handleDraftChange = (event) => {
    const nextValue = event.target.value
    setDraft(nextValue)

    if (!activeChatId || !socket) {
      return
    }

    socket.emit('typing', {
      chatId: activeChatId,
      isTyping: true,
    })

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit('typing', {
        chatId: activeChatId,
        isTyping: false,
      })
      typingTimeoutRef.current = null
    }, 1400)
  }

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const emptySidebar = !loadingChats && visibleChats.length === 0

  return (
    <main className="min-h-screen bg-sidebar-background px-3 py-3 md:px-4 md:py-4">
      <div className="grid min-h-[calc(100svh-1.5rem)] gap-3 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="glass surface-outline flex min-h-[320px] flex-col rounded-[30px] border border-border/60 bg-sidebar-background/92">
          <div className="flex items-center justify-between px-5 py-5">
            <PulseLogo compact />
            <div className="flex items-center gap-2">
              <Badge className="border border-border/60 bg-secondary/60 text-muted-foreground">
                {visibleChats.length} chats
              </Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-2xl bg-background/45 hover:bg-secondary"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search conversations..."
                className="h-11 rounded-2xl border-border/70 bg-background/55 pl-11"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {chatCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto px-3 pb-3">
            <div className="space-y-2">
              {visibleChats.map((chat) => (
                <SidebarChatItem
                  key={chat.id}
                  chat={chat}
                  currentUserId={user.id}
                  isActive={chat.id === activeChatId}
                  onSelect={() => startTransition(() => setActiveChatId(chat.id))}
                />
              ))}

              {loadingChats ? (
                <div className="rounded-[24px] border border-border/50 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
                  Loading conversations...
                </div>
              ) : null}

              {emptySidebar ? (
                <div className="rounded-[24px] border border-dashed border-border/60 bg-background/35 px-4 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No chats match this view.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Switch categories or clear your search to reveal more conversations.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border/60 px-4 py-4">
            <div className="flex items-center justify-between rounded-[24px] border border-border/60 bg-background/45 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {socketError || (isConnected ? 'Realtime connected' : 'Waiting for socket')}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={logout}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </aside>

        <section
          className={`glass surface-outline flex min-h-[320px] flex-col rounded-[30px] border bg-surface-1/88 ${
            isTemporaryChat
              ? 'border-temporary/35 shadow-[0_0_0_1px_hsl(var(--temporary)_/_0.12),0_30px_70px_hsl(280_60%_20%_/_0.28)]'
              : 'border-border/60'
          }`}
        >
          {activeChat ? (
            <>
              <header
                className={`flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 ${
                  isTemporaryChat
                    ? 'border-temporary/20 bg-[linear-gradient(135deg,hsl(var(--temporary)_/_0.16),hsl(var(--primary)_/_0.08))]'
                    : 'border-border/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ChatAvatar
                    label={activeIdentity.avatarLabel}
                    tone={activeIdentity.tone}
                    online={activeIdentity.online}
                    size="lg"
                    showPresence={activeIdentity.tone !== 'group'}
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-semibold text-foreground">{activeIdentity.title}</h1>
                      {activeChat.temporaryMode?.enabled ? (
                        <Badge className="border border-temporary/25 bg-temporary/12 text-temporary">
                          <Lock className="size-3.5" />
                          Temporary mode
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {typingState?.name ? `${typingState.name} is typing...` : activeIdentity.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-2xl bg-background/40 hover:bg-secondary"
                  >
                    <Search className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-2xl bg-background/40 hover:bg-secondary"
                    onClick={() => startCall('voice')}
                    disabled={!activeDirectParticipant}
                  >
                    <Phone className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-2xl bg-background/40 hover:bg-secondary"
                    onClick={() => startCall('video')}
                    disabled={!activeDirectParticipant}
                  >
                    <Video className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-2xl bg-background/40 hover:bg-secondary"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Info className="size-4" />
                  </Button>
                </div>
              </header>

              {activeChat.temporaryMode?.enabled ? (
                <div className="border-b border-temporary/15 bg-[linear-gradient(90deg,hsl(var(--temporary)_/_0.18),hsl(var(--primary)_/_0.05))] px-5 py-3 text-sm text-temporary">
                  <div className="flex items-center gap-2 font-medium">
                    <Lock className="size-4" />
                    Temporary mode is enabled. Messages may expire automatically.
                  </div>
                </div>
              ) : null}

              <div
                className={`flex-1 overflow-y-auto px-4 py-5 md:px-6 ${
                  isTemporaryChat
                    ? 'bg-[radial-gradient(circle_at_top,hsl(var(--temporary)_/_0.08),transparent_26%)]'
                    : ''
                }`}
              >
                <div className="mx-auto flex max-w-4xl flex-col gap-4">
                  <div className="mx-auto rounded-full bg-background/50 px-4 py-1 text-xs text-muted-foreground">
                    Today
                  </div>

                  {loadingMessages ? (
                    <div className="rounded-[24px] border border-border/60 bg-background/45 px-4 py-8 text-center text-sm text-muted-foreground">
                      Loading conversation...
                    </div>
                  ) : null}

                  {!loadingMessages && activeMessages.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-border/60 bg-background/35 px-6 py-12 text-center">
                      <p className="text-lg font-semibold text-foreground">No messages yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Start the conversation and the thread will appear here in realtime.
                      </p>
                    </div>
                  ) : null}

                  {activeMessages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div
                className={`border-t px-4 py-4 md:px-6 ${
                  isTemporaryChat ? 'border-temporary/20 bg-temporary/6' : 'border-border/60'
                }`}
              >
                {sendError ? (
                  <Alert className="mb-4 border border-destructive/20 bg-destructive/8">
                    <AlertTitle>Message issue</AlertTitle>
                    <AlertDescription>{sendError}</AlertDescription>
                  </Alert>
                ) : null}

                {activeChat.type === 'ai' ? (
                  <div className="mb-3 grid gap-2 md:grid-cols-3">
                    {aiActionChips.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => sendMessage(chip.prompt)}
                        className="rounded-[22px] border border-primary/20 bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.14),transparent)] px-3 py-3 text-left transition hover:border-primary/30 hover:bg-primary/12"
                      >
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          <Sparkles className="size-3.5" />
                          {chip.label}
                        </span>
                        <p className="mt-2 text-sm text-secondary-foreground">{chip.description}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {selectedMedia ? (
                  <div
                    className={`mb-3 rounded-[24px] border px-4 py-3 ${
                      isTemporaryChat
                        ? 'border-temporary/25 bg-temporary/10'
                        : 'border-border/60 bg-background/45'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {selectedMedia.kind === 'image' && selectedMedia.previewUrl ? (
                          <img
                            src={selectedMedia.previewUrl}
                            alt={selectedMedia.file.name}
                            className="size-14 rounded-2xl object-cover"
                          />
                        ) : selectedMedia.kind === 'video' ? (
                          <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                            <Video className="size-5" />
                          </div>
                        ) : (
                          <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                            <ImagePlus className="size-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {selectedMedia.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedMedia.file.size / (1024 * 1024)).toFixed(2)} MB ready to upload
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-2xl"
                          onClick={clearSelectedMedia}
                          disabled={uploadingMedia}
                        >
                          <X className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          className={`rounded-2xl ${
                            isTemporaryChat ? 'bg-temporary text-white hover:bg-temporary/90' : ''
                          }`}
                          onClick={handleUploadMedia}
                          disabled={uploadingMedia}
                        >
                          <UploadCloud className="size-4" />
                          {uploadingMedia ? 'Uploading...' : 'Send attachment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div
                  className={`flex items-end gap-3 rounded-[28px] border px-3 py-3 ${
                    activeChat.temporaryMode?.enabled
                      ? 'border-temporary/50 bg-[linear-gradient(135deg,hsl(var(--temporary)_/_0.12),hsl(var(--background)))]'
                      : 'border-border/70 bg-background/55'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleMediaSelection}
                  />

                  <Button variant="ghost" size="icon-sm" className="rounded-2xl text-muted-foreground">
                    <Smile className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={`rounded-2xl text-muted-foreground ${
                      selectedMedia ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </Button>

                  <textarea
                    value={draft}
                    onChange={handleDraftChange}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={
                      activeChat.type === 'ai' ? 'Ask my.ai anything...' : 'Type a message...'
                    }
                    className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    rows={1}
                  />

                  <Button
                    size="icon-lg"
                    className={`rounded-2xl ${
                      isTemporaryChat ? 'bg-temporary text-white hover:bg-temporary/90' : ''
                    }`}
                    onClick={() => sendMessage()}
                    disabled={!draft.trim() || !isConnected}
                  >
                    <SendHorizontal className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <div className="max-w-md rounded-[32px] border border-border/60 bg-background/45 px-8 py-10 text-center">
                <PulseLogo className="justify-center" />
                <h1 className="mt-6 text-2xl font-semibold text-foreground">Your conversations will appear here</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Load or select a chat from the sidebar to see the thread, typing indicators, and
                  live message updates.
                </p>
                {chatError ? (
                  <p className="mt-4 text-sm text-destructive">{chatError}</p>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={(nextOpen) => {
          setNewChatOpen(nextOpen)
          if (!nextOpen) {
            setUserSearchTerm('')
            setSettingsError('')
            setNewChatError('')
          }
        }}
        searchTerm={userSearchTerm}
        onSearchChange={setUserSearchTerm}
        searchResults={userSearchResults}
        onSelectUser={handleSelectUserForChat}
        onSelectAi={handleSelectAiChat}
        error={newChatError}
        loading={loadingUserSearch}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={(nextOpen) => {
          setSettingsOpen(nextOpen)
          if (!nextOpen) {
            setSettingsError('')
          }
        }}
        privacy={privacySettings}
        onTogglePrivacy={handleTogglePrivacy}
        savingPrivacy={savingPrivacy}
        activeChatIdentity={activeIdentity}
        blockedUsers={blockedUsers}
        activeDirectParticipant={activeDirectParticipant}
        onToggleBlock={handleToggleBlock}
        blockingInProgress={blockingInProgress || loadingBlockedUsers}
        error={settingsError}
      />

      <CallModal
        callState={callState}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        onEnd={handleEndCall}
        onClose={handleCloseCallModal}
        onToggleMute={() =>
          setCallState((current) => ({
            ...current,
            muted: !current.muted,
          }))
        }
        onToggleCamera={() =>
          setCallState((current) => ({
            ...current,
            cameraDisabled: !current.cameraDisabled,
          }))
        }
        onToggleScreenShare={() =>
          setCallState((current) => ({
            ...current,
            screenSharing: !current.screenSharing,
          }))
        }
      />
    </main>
  )
}
