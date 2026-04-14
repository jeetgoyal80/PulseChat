import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ChatInfoDrawer from '@/components/chat/ChatInfoDrawer';
import EmptyState from '@/components/chat/EmptyState';
import CallScreen from '@/components/calls/CallScreen';
import IncomingCallModal from '@/components/calls/IncomingCallModal';
import TemporaryChatModal from '@/components/modals/TemporaryChatModal';
import NewChatModal from '@/components/modals/NewChatModal';
import AuthScreen from '@/components/auth/AuthScreen';
import { api, getErrorMessage } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { normalizeChat, normalizeMessage, upsertMessageList } from '@/lib/chat';
import { rtcConfig, stopMediaStream } from '@/lib/webrtc';

const TEMP_DURATIONS = {
  '1d': 86400,
  '3d': 259200,
  '5d': 432000,
  '7d': 604800,
};

const defaultPrivacy = {
  showLastSeen: true,
  showOnlineStatus: true,
  showTypingIndicator: true,
};

const emptyCallState = {
  open: false,
  type: 'voice',
  contact: '',
  callId: null,
  remoteUserId: null,
  status: 'idle',
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  error: '',
};

const ChatApp = () => {
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const chatsRef = useRef([]);
  const usersRef = useRef([]);
  const currentUserRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const lastDirectChatIdRef = useRef(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authView, setAuthView] = useState({ mode: 'login', email: '' });
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [privacy, setPrivacy] = useState(defaultPrivacy);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [typingByChat, setTypingByChat] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState(emptyCallState);
  const [draftText, setDraftText] = useState('');
  const [discardedDraftIds, setDiscardedDraftIds] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  selectedChatIdRef.current = selectedChatId;
  chatsRef.current = chats;
  usersRef.current = users;
  currentUserRef.current = currentUser;

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;
    const timeout = setTimeout(() => setOtpCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timeout);
  }, [otpCooldown]);

  const setAuthStage = (mode, email = '') => {
    setAuthView({ mode, email });
    if (mode === 'verify') {
      setOtpCooldown((current) => (current > 0 ? current : 30));
    }
  };

  const cleanupCallResources = () => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingIceCandidatesRef.current = [];
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
  };

  const resetCall = () => {
    cleanupCallResources();
    setIncomingCall(null);
    setCallState(emptyCallState);
  };

  const handleUnauthorized = () => {
    socketRef.current?.disconnect();
    cleanupCallResources();
    setCurrentUser(null);
    setChats([]);
    setMessagesByChat({});
    setSelectedChatId(null);
    setAuthStage('login');
    toast.error('Your session expired. Please sign in again.');
  };

  const safeRequest = async (request, fallbackMessage) => {
    try {
      return await request();
    } catch (error) {
      if (error?.response?.status === 401) {
        handleUnauthorized();
        throw error;
      }
      throw new Error(getErrorMessage(error, fallbackMessage));
    }
  };

  const loadUsers = async () => {
    const [usersResponse, blockedResponse] = await Promise.all([
      safeRequest(() => api.get('/users'), 'Failed to load users'),
      safeRequest(() => api.get('/users/blocked'), 'Failed to load blocked users'),
    ]);

    setUsers(usersResponse.data.map((user) => ({
      id: user._id,
      name: user.name,
      about: user.bio || user.email,
      status: user.isOnline ? 'online' : 'offline',
    })));
    setBlockedUsers(blockedResponse.data.blockedUsers || []);
  };

  const loadChats = async () => {
    const response = await safeRequest(() => api.get('/chats'), 'Failed to load chats');
    setChats(response.data.chats || []);
  };

  const loadMessages = async (chatId) => {
    const response = await safeRequest(() => api.get(`/messages/${chatId}`), 'Failed to load messages');
    const normalized = (response.data.messages || []).map((message) => normalizeMessage(message, currentUserRef.current.id));
    setMessagesByChat((current) => ({ ...current, [chatId]: normalized }));
  };

  const getCallMedia = async (type) => {
    if (!window.isSecureContext) {
      throw new Error('Calls require HTTPS on mobile browsers so microphone and camera permissions can be granted.');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support camera or microphone access.');
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video'
          ? {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
      });
    } catch (error) {
      const message = error?.name === 'NotAllowedError'
        ? 'Camera or microphone permission was denied.'
        : error?.name === 'NotFoundError'
        ? 'No usable camera or microphone was found on this device.'
        : error?.name === 'NotReadableError'
        ? 'Camera or microphone is already being used by another app.'
        : error?.name === 'OverconstrainedError'
        ? 'This device could not satisfy the requested camera settings.'
        : 'Could not access camera or microphone.';
      throw new Error(message);
    }
  };

  const ensureSocketReady = () => new Promise((resolve, reject) => {
    const socket = socketRef.current;
    if (!socket) {
      reject(new Error('Realtime connection is unavailable right now.'));
      return;
    }

    if (socket.connected) {
      resolve(socket);
      return;
    }

    const timeout = window.setTimeout(() => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
      reject(new Error('Could not reconnect to realtime services. Please try again.'));
    }, 6000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
    };

    const handleConnect = () => {
      cleanup();
      resolve(socket);
    };

    const handleError = () => {
      cleanup();
      reject(new Error('Could not reconnect to realtime services. Please try again.'));
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleError);
    socket.connect();
  });

  const flushPendingIce = async () => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      if (candidate && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
  };

  const createPeerConnection = (remoteUserId, callId, type) => {
    const peer = new RTCPeerConnection(rtcConfig);
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice_candidate', {
          to: remoteUserId,
          callId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
      setCallState((current) => ({ ...current, remoteStream, error: '' }));
    };

    peer.onconnectionstatechange = () => {
      if (['failed', 'disconnected'].includes(peer.connectionState)) {
        setCallState((current) => ({ ...current, error: 'Call connection is unstable.' }));
      }
    };

    peerConnectionRef.current = peer;

    setCallState((current) => ({
      ...current,
      callId,
      remoteUserId,
      type,
      remoteStream,
    }));

    return peer;
  };

  const bootstrapOutgoingCall = async (contactId, contactName, type) => {
    const socket = await ensureSocketReady();
    const localStream = await getCallMedia(type);
    localStreamRef.current = localStream;
    const peer = createPeerConnection(contactId, null, type);

    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit('call_user', {
      userToCall: contactId,
      signalData: offer,
      from: currentUserRef.current.id,
      name: currentUserRef.current.name,
      type,
    });

    setCallState({
      ...emptyCallState,
      open: true,
      status: 'ringing',
      type,
      contact: contactName,
      remoteUserId: contactId,
      localStream,
      remoteStream: remoteStreamRef.current,
    });
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      const socket = await ensureSocketReady();
      const localStream = await getCallMedia(incomingCall.type);
      localStreamRef.current = localStream;
      const peer = createPeerConnection(incomingCall.from, incomingCall.callId, incomingCall.type);
      localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
      await flushPendingIce();

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit('accept_call', {
        callId: incomingCall.callId,
        to: incomingCall.from,
        signal: answer,
      });

      setCallState({
        ...emptyCallState,
        open: true,
        status: 'active',
        type: incomingCall.type,
        contact: incomingCall.contact,
        callId: incomingCall.callId,
        remoteUserId: incomingCall.from,
        localStream,
        remoteStream: remoteStreamRef.current,
      });
      setIncomingCall(null);
    } catch (error) {
      toast.error(error.message || 'Failed to answer the call.');
      resetCall();
    }
  };

  const handleRemoteIceCandidate = async (candidate) => {
    if (!candidate) return;
    if (!peerConnectionRef.current || !peerConnectionRef.current.remoteDescription) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      setCallState((current) => ({ ...current, error: 'Failed to establish the media connection.' }));
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data.user);
        setPrivacy(response.data.user.privacy || defaultPrivacy);
      } catch (error) {
        if (error?.response?.status !== 401) {
          setAuthError(getErrorMessage(error, 'Failed to restore your session.'));
        }
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;

    const socket = connectSocket();
    socketRef.current = socket;

    const joinKnownChats = (chatList = chatsRef.current) => {
      chatList.forEach((chat) => {
        if (chat?._id) {
          socket.emit('join_chat', chat._id);
        }
      });
    };

    const initialize = async () => {
      try {
        const [chatsResponse, usersResponse, blockedResponse] = await Promise.all([
          safeRequest(() => api.get('/chats'), 'Failed to load chats'),
          safeRequest(() => api.get('/users'), 'Failed to load users'),
          safeRequest(() => api.get('/users/blocked'), 'Failed to load blocked users'),
        ]);

        const nextChats = chatsResponse.data.chats || [];
        setChats(nextChats);
        setUsers(usersResponse.data.map((user) => ({
          id: user._id,
          name: user.name,
          about: user.bio || user.email,
          status: user.isOnline ? 'online' : 'offline',
        })));
        setBlockedUsers(blockedResponse.data.blockedUsers || []);
        joinKnownChats(nextChats);
      } catch (error) {
        toast.error(error.message);
      }
    };

    initialize();

    socket.on('connect', () => {
      setSocketConnected(true);
      joinKnownChats();
      if (selectedChatIdRef.current) {
        socket.emit('join_chat', selectedChatIdRef.current);
      }
    });

    socket.on('reconnect', () => {
      setSocketConnected(true);
      joinKnownChats();
      if (selectedChatIdRef.current) {
        socket.emit('join_chat', selectedChatIdRef.current);
      }
    });

    const handleIncomingMessage = (message) => {
      const chatId = message.chatId?._id || message.chatId;
      const hasChat = chatsRef.current.some((chat) => String(chat._id) === String(chatId));

      setMessagesByChat((current) => ({
        ...current,
        [chatId]: upsertMessageList(current[chatId] || [], message, currentUserRef.current.id),
      }));

      if (!hasChat) {
        loadChats();
      } else {
        setChats((current) => current.map((chat) => (
          chat._id === chatId ? { ...chat, recentMessage: message, updatedAt: message.createdAt || new Date().toISOString() } : chat
        )));
      }

      if (String(selectedChatIdRef.current) !== String(chatId) && String(message.sender?._id || message.sender) !== String(currentUserRef.current.id)) {
        setUnreadCounts((current) => ({ ...current, [chatId]: (current[chatId] || 0) + 1 }));
      } else if (String(message.sender?._id || message.sender) !== String(currentUserRef.current.id)) {
        socket.emit('message_seen', { chatId });
      }
    };

    socket.on('receive_message', handleIncomingMessage);
    socket.on('ai_response', handleIncomingMessage);

    socket.on('display_typing', ({ chatId, userId, isTyping }) => {
      if (!chatId) return;
      setTypingByChat((current) => ({
        ...current,
        [chatId]: isTyping ? userId : null,
      }));
    });

    socket.on('typing_start', ({ chatId, userId }) => {
      if (!chatId) return;
      setTypingByChat((current) => ({
        ...current,
        [chatId]: userId || true,
      }));
    });

    socket.on('typing_stop', ({ chatId }) => {
      if (!chatId) return;
      setTypingByChat((current) => ({
        ...current,
        [chatId]: null,
      }));
    });

    socket.on('user_status_change', ({ userId, isOnline, lastSeen }) => {
      setChats((current) => current.map((chat) => ({
        ...chat,
        participants: (chat.participants || []).map((participant) => (
          String(participant._id) === String(userId)
            ? { ...participant, isOnline, lastSeen: lastSeen || participant.lastSeen }
            : participant
        )),
      })));
    });

    socket.on('temporary_mode_toggled', ({ chatId, temporaryMode }) => {
      setChats((current) => current.map((chat) => (
        chat._id === chatId ? { ...chat, temporaryMode } : chat
      )));
    });

    socket.on('messages_status_updated', ({ chatId, status }) => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] || []).map((message) => (message.isMe ? { ...message, status } : message)),
      }));
    });

    socket.on('message_edited', ({ chatId, messageId, newContent }) => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] || []).map((message) => (
          message.id === messageId ? { ...message, content: newContent } : message
        )),
      }));
    });

    socket.on('message_deleted', ({ chatId, messageId }) => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] || []).filter((message) => message.id !== messageId),
      }));
    });

    socket.on('group_updated', loadChats);
    socket.on('added_to_group', loadChats);
    socket.on('removed_from_group', ({ chatId }) => {
      if (String(selectedChatIdRef.current) === String(chatId)) {
        setSelectedChatId(null);
      }
      loadChats();
    });

    socket.on('incoming_call', ({ callId, from, type, signal }) => {
      const matchingChat = chatsRef.current.find((chat) => (
        (chat.participants || []).some((participant) => String(participant._id) === String(from))
      ));
      const matchingUser = usersRef.current.find((user) => String(user.id) === String(from));
      const contact = matchingChat?.participants?.find((participant) => String(participant._id) === String(from))?.name || matchingUser?.name || 'Unknown caller';
      setIncomingCall({ callId, from, contact, type, signal });
    });

    socket.on('call_accepted', async ({ callId, signal }) => {
      try {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        await flushPendingIce();
        setCallState((current) => ({ ...current, open: true, status: 'active', callId, error: '' }));
      } catch {
        setCallState((current) => ({ ...current, error: 'Failed to connect the call.' }));
      }
    });

    socket.on('ice_candidate', ({ candidate }) => {
      handleRemoteIceCandidate(candidate);
    });

    socket.on('call_rejected', () => {
      toast.error('Call was rejected.');
      resetCall();
    });

    socket.on('call_ended', () => {
      resetCall();
    });

    socket.on('message_error', ({ message }) => toast.error(message));
    socket.on('call_error', ({ message }) => {
      toast.error(message);
      resetCall();
    });
    socket.on('disconnect', () => {
      setSocketConnected(false);
      setTypingByChat({});
    });

    return () => {
      socket.removeAllListeners();
      disconnectSocket();
      socketRef.current = null;
      setSocketConnected(false);
      cleanupCallResources();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedChatId) return;

    const joinChat = async () => {
      try {
        socketRef.current?.emit('join_chat', selectedChatId);
        if (!messagesByChat[selectedChatId]) {
          await loadMessages(selectedChatId);
        }
        socketRef.current?.emit('message_seen', { chatId: selectedChatId });
        setUnreadCounts((current) => ({ ...current, [selectedChatId]: 0 }));
      } catch (error) {
        toast.error(error.message);
      }
    };

    joinChat();
  }, [currentUser, selectedChatId]);

  useEffect(() => {
    if (!socketConnected || !socketRef.current) return;
    chats.forEach((chat) => {
      if (chat?._id) {
        socketRef.current.emit('join_chat', chat._id);
      }
    });
  }, [chats, socketConnected]);

  const allDecoratedChats = useMemo(() => (
    chats
      .map((chat) => normalizeChat(chat, currentUser?.id, unreadCounts[chat._id] || 0, typingByChat[chat._id]))
      .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0))
  ), [chats, currentUser?.id, typingByChat, unreadCounts]);

  const decoratedChats = useMemo(() => {
    switch (activeCategory) {
      case 'unread':
        return allDecoratedChats.filter((chat) => chat.unreadCount > 0);
      case 'groups':
        return allDecoratedChats.filter((chat) => chat.isGroup);
      case 'ai':
        return allDecoratedChats.filter((chat) => chat.isAI);
      default:
        return allDecoratedChats;
    }
  }, [activeCategory, allDecoratedChats]);

  const selectedChat = useMemo(
    () => allDecoratedChats.find((chat) => chat.id === selectedChatId) || null,
    [allDecoratedChats, selectedChatId]
  );
  const selectedMessages = selectedChatId ? (messagesByChat[selectedChatId] || []) : [];
  const isBlocked = selectedChat && blockedUsers.some((user) => String(user._id) === String(selectedChat.contact.id));
  const draftTargetChat = useMemo(() => {
    const directChats = allDecoratedChats.filter((chat) => !chat.isAI && !chat.isGroup);
    return directChats.find((chat) => chat.id === lastDirectChatIdRef.current) || directChats[0] || null;
  }, [allDecoratedChats]);

  useEffect(() => {
    if (selectedChat && !selectedChat.isAI && !selectedChat.isGroup) {
      lastDirectChatIdRef.current = selectedChat.id;
    }
  }, [selectedChat]);

  const sendDraftToTarget = async (message) => {
    if (!draftTargetChat) {
      toast.error('Open a direct chat first to choose where AI drafts should be sent.');
      return;
    }

    try {
      await safeRequest(() => api.post(`/messages/${draftTargetChat.id}`, { content: message.content }), 'Failed to send AI draft');
      setDiscardedDraftIds((current) => [...new Set([...current, message.id])]);
      setDraftText('');
      toast.success(`Draft sent to ${draftTargetChat.contact.name}`);
      setSelectedChatId(draftTargetChat.id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const editDraftInTarget = (message) => {
    if (!draftTargetChat) {
      toast.error('Open a direct chat first to edit where the AI draft should go.');
      return;
    }
    setDiscardedDraftIds((current) => current.filter((id) => id !== message.id));
    setDraftText(message.content);
    setSelectedChatId(draftTargetChat.id);
  };

  const discardDraft = (message) => {
    setDiscardedDraftIds((current) => [...new Set([...current, message.id])]);
    toast.success('Draft discarded');
  };

  const aiDraftActions = useMemo(() => ({
    get(message) {
      if (discardedDraftIds.includes(message.id) || !draftTargetChat) return null;
      return {
        targetName: draftTargetChat.contact.name,
        onSend: sendDraftToTarget,
        onEdit: editDraftInTarget,
        onDiscard: discardDraft,
      };
    },
  }), [discardedDraftIds, draftTargetChat]);

  const handleAuthSubmit = async (mode, form) => {
    setAuthSubmitting(true);
    setAuthError('');

    try {
      let response;

      if (mode === 'login') response = await api.post('/auth/login', form);
      if (mode === 'register') response = await api.post('/auth/register', form);
      if (mode === 'verify') response = await api.post('/auth/verify-email', form);
      if (mode === 'forgot') response = await api.post('/auth/forgot-password', form);
      if (mode === 'reset') response = await api.post('/auth/reset-password', form);

      if (response?.data?.user) {
        setCurrentUser(response.data.user);
        setPrivacy(response.data.user.privacy || defaultPrivacy);
      } else if (response?.data?.nextStep === 'verify-email') {
        setAuthStage('verify', response.data.email || form.email);
        toast.success(response.data.message);
      } else if (mode === 'forgot') {
        setAuthStage('reset', response.data.email || form.email);
        toast.success(response.data.message);
      } else {
        if (mode === 'reset') {
          setAuthStage('login', form.email);
        }
        toast.success(response?.data?.message || 'Success');
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Authentication failed.');
      setAuthError(message);

      if (error?.response?.status === 403 && error?.response?.data?.nextStep === 'verify-email') {
        setAuthStage('verify', error.response.data.email || form.email);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendOtp = async (email) => {
    if (!email || otpCooldown > 0) return;
    try {
      setAuthSubmitting(true);
      await api.post('/auth/resend-verification-otp', { email });
      setOtpCooldown(30);
      toast.success('A new OTP has been sent.');
    } catch (error) {
      setAuthError(getErrorMessage(error, 'Failed to resend OTP.'));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to logout cleanly.'));
    } finally {
      socketRef.current?.disconnect();
      cleanupCallResources();
      setCurrentUser(null);
      setChats([]);
      setMessagesByChat({});
      setSelectedChatId(null);
      setAuthStage('login');
    }
  };

  const handlePrivacyChange = async (patch) => {
    try {
      const response = await safeRequest(() => api.put('/users/settings/privacy', patch), 'Failed to update privacy settings');
      setPrivacy(response.data.privacy);
      toast.success('Privacy updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateChat = async (userId) => {
    try {
      const response = await safeRequest(() => api.post('/chats', { participantId: userId, type: 'one-to-one' }), 'Failed to open chat');
      const chat = response.data;
      setChats((current) => (current.some((item) => item._id === chat._id) ? current : [chat, ...current]));
      setSelectedChatId(chat._id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCreateGroup = async (groupName, memberIds) => {
    try {
      const response = await safeRequest(() => api.post('/chats/group', { chatName: groupName, participants: memberIds }), 'Failed to create group');
      setChats((current) => [response.data, ...current]);
      setSelectedChatId(response.data._id);
      toast.success('Group created');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedChatId || !currentUser) return;

    const optimisticMessage = normalizeMessage({
      _id: `temp-${Date.now()}`,
      chatId: selectedChatId,
      sender: currentUser.id,
      content,
      messageType: 'text',
      status: 'sent',
      createdAt: new Date().toISOString(),
      optimistic: true,
    }, currentUser.id);

    setMessagesByChat((current) => ({
      ...current,
      [selectedChatId]: [...(current[selectedChatId] || []), optimisticMessage],
    }));

    try {
      const response = await safeRequest(() => api.post(`/messages/${selectedChatId}`, { content }), 'Failed to send message');
      const message = response.data.data;
      setMessagesByChat((current) => ({
        ...current,
        [selectedChatId]: upsertMessageList(current[selectedChatId] || [], message, currentUser.id),
      }));
      setChats((current) => current.map((chat) => (
        chat._id === selectedChatId ? { ...chat, recentMessage: message, updatedAt: message.createdAt } : chat
      )));
    } catch (error) {
      setMessagesByChat((current) => ({
        ...current,
        [selectedChatId]: (current[selectedChatId] || []).filter((message) => message.id !== optimisticMessage.id),
      }));
      toast.error(error.message);
    }
  };

  const handleUpload = async (file) => {
    if (!selectedChatId) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      await safeRequest(() => api.post(`/messages/${selectedChatId}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }), 'Failed to upload file');
      toast.success(file.type.startsWith('audio/') ? 'Voice message sent' : 'Attachment uploaded');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTyping = (isTyping) => {
    if (!selectedChatId || !socketRef.current) return;

    if (isTyping) {
      socketRef.current.emit('typing', { chatId: selectedChatId, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { chatId: selectedChatId, isTyping: false });
      }, 1200);
      return;
    }

    clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('typing', { chatId: selectedChatId, isTyping: false });
  };

  const handleToggleTemporary = async (durationKey) => {
    if (!selectedChatId) return;

    const enabled = durationKey !== 'off';
    const duration = TEMP_DURATIONS[durationKey] || 0;

    try {
      const response = await safeRequest(
        () => api.put(`/chats/${selectedChatId}/temp-mode`, { enabled, duration }),
        'Failed to update temporary chat'
      );
      setChats((current) => current.map((chat) => (chat._id === selectedChatId ? response.data.chat : chat)));
      toast.success('Temporary chat updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedChat) return;

    try {
      if (isBlocked) {
        await safeRequest(() => api.put('/users/unblock', { userToUnblockId: selectedChat.contact.id }), 'Failed to unblock user');
      } else {
        await safeRequest(() => api.put('/users/block', { userToBlockId: selectedChat.contact.id }), 'Failed to block user');
      }
      await loadUsers();
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddGroupMembers = async (_groupName, memberIds) => {
    if (!selectedChatId) return;

    try {
      await Promise.all(memberIds.map((memberId) => safeRequest(
        () => api.put('/chats/group/add', { chatId: selectedChatId, userIdToAdd: memberId }),
        'Failed to add member'
      )));
      await loadChats();
      toast.success('Group updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveGroupMember = async (memberId) => {
    if (!selectedChatId) return;

    try {
      await safeRequest(() => api.put('/chats/group/remove', { chatId: selectedChatId, userIdToRemove: memberId }), 'Failed to remove member');
      await loadChats();
      toast.success('Member removed');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleOpenCall = async (type) => {
    if (!selectedChat) return;
    try {
      await bootstrapOutgoingCall(selectedChat.contact.id, selectedChat.contact.name, type);
    } catch (error) {
      toast.error(error.message || 'Failed to start the call.');
      resetCall();
    }
  };

  const handleDeclineCall = () => {
    if (!incomingCall) return;
    socketRef.current?.emit('reject_call', { callId: incomingCall.callId, to: incomingCall.from });
    resetCall();
  };

  const handleEndCall = () => {
    if (callState.remoteUserId) {
      socketRef.current?.emit('end_call', { callId: callState.callId, to: callState.remoteUserId, reason: 'ended' });
    }
    resetCall();
  };

  const handleToggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !callState.isMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setCallState((current) => ({ ...current, isMuted: nextMuted }));
  };

  const handleToggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextVideoOff = !callState.isVideoOff;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !nextVideoOff;
    });
    setCallState((current) => ({ ...current, isVideoOff: nextVideoOff }));
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (!currentUser) {
    return (
      <AuthScreen
        loading={authSubmitting}
        error={authError}
        authView={authView}
        cooldown={otpCooldown}
        onSubmit={handleAuthSubmit}
        onResendOtp={handleResendOtp}
        onModeChange={(mode, email) => setAuthView({ mode, email })}
      />
    );
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0`}>
        <ChatSidebar
          chats={decoratedChats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onNewChat={() => setShowNewChat(true)}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          currentUser={currentUser}
          privacy={privacy}
          onPrivacyChange={handlePrivacyChange}
          onLogout={handleLogout}
        />
      </div>

      <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0`}>
        {selectedChatId ? (
          <div className="flex-1 flex">
            <div className="flex-1 min-w-0">
              <ChatWindow
                chat={selectedChat}
                messages={selectedMessages}
                blocked={isBlocked}
                draftText={draftText}
                aiDraftActions={aiDraftActions}
                onBack={() => setSelectedChatId(null)}
                onOpenInfo={() => setShowInfo(true)}
                onOpenCall={handleOpenCall}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onUpload={handleUpload}
                onComposerError={(message) => toast.error(message)}
                onDraftConsumed={() => setDraftText('')}
              />
            </div>

            <AnimatePresence>
              {showInfo && selectedChat && (
                <ChatInfoDrawer
                  chat={selectedChat}
                  currentUser={currentUser}
                  blocked={isBlocked}
                  onClose={() => setShowInfo(false)}
                  onEnableTemporary={() => setShowTempModal(true)}
                  onToggleBlock={handleToggleBlock}
                  onAddMembers={() => setShowGroupModal(true)}
                  onRemoveMember={handleRemoveGroupMember}
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <TemporaryChatModal
        isOpen={showTempModal}
        onClose={() => setShowTempModal(false)}
        onEnable={handleToggleTemporary}
        currentDuration={selectedChat?.temporaryChat?.duration}
        isEnabled={selectedChat?.temporaryChat?.enabled}
      />

      <NewChatModal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        users={users}
        onSelect={handleCreateChat}
        onCreateGroup={handleCreateGroup}
      />

      <NewChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        users={users.filter((user) => !selectedChat?.groupMembers?.some((member) => String(member.id) === String(user.id)))}
        onSelect={() => {}}
        onCreateGroup={handleAddGroupMembers}
        title="Add Members"
        groupMode
      />

      <CallScreen
        call={callState}
        onClose={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
      />
      <IncomingCallModal call={incomingCall} onAccept={acceptIncomingCall} onDecline={handleDeclineCall} />
    </div>
  );
};

export default ChatApp;
