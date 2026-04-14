import { useEffect, useRef } from 'react';
import { Search, Phone, Video, ChevronLeft, Clock, Info } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageComposer from '@/components/chat/MessageComposer';
import TypingIndicator from '@/components/chat/TypingIndicator';

const ChatHeader = ({ chat, blocked, onBack, onOpenInfo, onOpenCall }) => (
  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card">
    <button onClick={onBack} className="md:hidden w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors">
      <ChevronLeft className="w-5 h-5 text-muted-foreground" />
    </button>
    <button onClick={onOpenInfo} className="flex items-center gap-3 flex-1 min-w-0">
      <UserAvatar name={chat.contact.name} status={chat.contact.status} isAI={chat.isAI} />
      <div className="min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{chat.contact.name}</span>
          {chat.temporaryChat?.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-temporary/15 text-temporary text-[10px] font-medium">
              <Clock className="w-3 h-3" />
              {chat.temporaryChat.duration}s
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {blocked
            ? 'Blocked'
            : chat.typing
            ? 'typing...'
            : chat.contact.status === 'online'
            ? 'Online'
            : chat.contact.lastSeen
            ? `Last seen ${chat.contact.lastSeen}`
            : 'Offline'}
        </span>
      </div>
    </button>

    <div className="flex items-center gap-1">
      <button className="w-9 h-9 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors">
        <Search className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={() => onOpenCall('voice')}
        disabled={blocked || chat.isAI || chat.isGroup}
        className="w-9 h-9 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40"
      >
        <Phone className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={() => onOpenCall('video')}
        disabled={blocked || chat.isAI || chat.isGroup}
        className="w-9 h-9 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors disabled:opacity-40"
      >
        <Video className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={onOpenInfo}
        className="w-9 h-9 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors"
      >
        <Info className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  </div>
);

const TemporaryChatBanner = ({ temporaryChat }) => {
  if (!temporaryChat?.enabled) return null;
  return (
    <div className="px-4 py-2 bg-temporary/5 border-b border-temporary/10 flex items-center gap-2">
      <Clock className="w-3.5 h-3.5 text-temporary" />
      <span className="text-xs text-temporary">
        Temporary chat enabled. Messages expire after {temporaryChat.duration} seconds.
      </span>
    </div>
  );
};

const ChatWindow = ({
  chat,
  messages,
  blocked,
  draftText,
  aiDraftActions,
  onBack,
  onOpenInfo,
  onOpenCall,
  onSendMessage,
  onTyping,
  onUpload,
  onComposerError,
  onDraftConsumed,
}) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, chat?.typing]);

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader chat={chat} blocked={blocked} onBack={onBack} onOpenInfo={onOpenInfo} onOpenCall={onOpenCall} />
      <TemporaryChatBanner temporaryChat={chat.temporaryChat} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            draftActions={chat.isAI ? aiDraftActions?.get(message) : null}
          />
        ))}
        {chat.typing && <TypingIndicator />}
      </div>

      <MessageComposer
        isAI={chat.isAI}
        disabled={blocked}
        draftText={draftText}
        onSend={onSendMessage}
        onTyping={onTyping}
        onUpload={onUpload}
        onError={onComposerError}
        onDraftConsumed={onDraftConsumed}
      />
    </div>
  );
};

export default ChatWindow;
