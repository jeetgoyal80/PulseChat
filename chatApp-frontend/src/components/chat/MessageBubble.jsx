import { Check, CheckCheck, FileText, Lock, PlayCircle } from 'lucide-react'

import { formatMessageTimestamp } from '@/lib/chat'
import { cn } from '@/lib/utils'

function MessageStatus({ message }) {
  if (!message.isMine) {
    return null
  }

  if (message.status === 'seen') {
    return <CheckCheck className="size-3.5 text-primary" />
  }

  return <Check className="size-3.5 text-primary-foreground/70" />
}

function MessageBody({ message }) {
  if (message.messageType === 'document') {
    return (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
      >
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{message.fileName || message.content}</p>
          <p className="text-xs text-muted-foreground">{message.mediaFormat || 'Attachment'}</p>
        </div>
      </a>
    )
  }

  if (message.messageType === 'video') {
    return (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
      >
        <PlayCircle className="size-6 text-primary" />
        <span className="text-sm font-medium">{message.fileName || 'Open video'}</span>
      </a>
    )
  }

  if (message.messageType === 'media') {
    return (
      <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
        <img
          src={message.mediaUrl}
          alt={message.fileName || 'Shared media'}
          className="max-h-72 w-full rounded-2xl object-cover"
        />
      </a>
    )
  }

  return <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.content}</p>
}

export function MessageBubble({ message }) {
  return (
    <div className={cn('flex w-full', message.isMine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[78%] space-y-2', message.isMine ? 'items-end' : 'items-start')}>
        {message.replyTo ? (
          <div
            className={cn(
              'rounded-2xl border px-3 py-2 text-xs',
              message.isMine
                ? 'border-white/10 bg-black/20 text-primary-foreground/80'
                : 'border-border/60 bg-background/45 text-muted-foreground'
            )}
          >
            <p className="mb-1 font-medium">{message.replyTo.senderName}</p>
            <p className="line-clamp-2">{message.replyTo.content}</p>
          </div>
        ) : null}

        <div
          className={cn(
            'rounded-[24px] px-4 py-3 shadow-[0_14px_30px_hsl(220_30%_3%_/_0.16)]',
            message.isMine ? 'bg-chat-outgoing text-primary-foreground' : 'bg-chat-incoming text-foreground',
            message.isTemporary && 'ring-1 ring-temporary/35'
          )}
        >
          {message.isTemporary ? (
            <div
              className={cn(
                'mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium',
                message.isMine
                  ? 'bg-black/15 text-primary-foreground/85'
                  : 'bg-temporary/12 text-temporary'
              )}
            >
              <Lock className="size-3" />
              Temporary
            </div>
          ) : null}
          <MessageBody message={message} />
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 px-1 text-[11px]',
            message.isMine ? 'justify-end text-primary-foreground/80' : 'justify-start text-muted-foreground'
          )}
        >
          <span>{formatMessageTimestamp(message.createdAt)}</span>
          <MessageStatus message={message} />
        </div>
      </div>
    </div>
  )
}
