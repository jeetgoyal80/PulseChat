import { Check, CheckCheck, FileText, Image as ImageIcon } from 'lucide-react';

const StatusIcon = ({ isMe, status }) => {
  if (!isMe || !status) return null;
  if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
  if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
};

const MessageBubble = ({ message, draftActions }) => {
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-muted-foreground bg-chat-system px-3 py-1.5 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${message.isMe ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] md:max-w-[65%] ${
          message.isMe
            ? 'bg-chat-outgoing rounded-2xl rounded-br-md'
            : message.type === 'ai-response'
            ? 'bg-surface-2 border border-primary/20 rounded-2xl rounded-bl-md'
            : 'bg-chat-incoming rounded-2xl rounded-bl-md'
        }`}
      >
        {message.replyTo?.content && (
          <div className="px-4 pt-3">
            <div className="rounded-xl bg-background/20 px-3 py-2 text-xs text-muted-foreground border border-border/40">
              {message.replyTo.content}
            </div>
          </div>
        )}

        {message.type === 'image' && (
          <div className="p-1.5">
            {message.imageUrl ? (
              <img src={message.imageUrl} alt={message.fileName || 'attachment'} className="w-56 h-40 rounded-xl object-cover" />
            ) : (
              <div className="w-56 h-40 rounded-xl bg-surface-3 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
          </div>
        )}

        {message.type === 'file' && (
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-foreground truncate">{message.fileName || message.content}</div>
              <div className="text-[11px] text-muted-foreground">{message.type === 'image' ? 'Image' : 'Attachment'}</div>
            </div>
          </div>
        )}

        {(message.type === 'text' || message.type === 'ai-response' || message.type === 'image') && message.content && (
          <div className="px-4 py-2.5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {draftActions && message.type === 'ai-response' && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            <button onClick={() => draftActions.onSend(message)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Send to {draftActions.targetName}
            </button>
            <button onClick={() => draftActions.onEdit(message)} className="rounded-lg bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground border border-border/50 hover:bg-surface-hover transition-colors">
              Edit
            </button>
            <button onClick={() => draftActions.onDiscard(message)} className="rounded-lg bg-surface-1 px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border/50 hover:bg-surface-hover transition-colors">
              Discard
            </button>
          </div>
        )}

        <div className={`flex items-center gap-1.5 px-4 pb-2 ${message.isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
          {message.optimistic && <span className="text-[10px] text-muted-foreground">sending</span>}
          <StatusIcon isMe={message.isMe} status={message.status} />
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
