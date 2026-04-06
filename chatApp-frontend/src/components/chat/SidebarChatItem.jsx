import { CheckCheck, Lock, Pin, Sparkles } from 'lucide-react'

import {
  chatHasUnread,
  formatSidebarTimestamp,
  getChatIdentity,
  getRecentMessagePreview,
} from '@/lib/chat'
import { cn } from '@/lib/utils'

import { ChatAvatar } from './ChatAvatar'

export function SidebarChatItem({ chat, currentUserId, isActive, onSelect }) {
  const identity = getChatIdentity(chat, currentUserId)
  const unread = chatHasUnread(chat, currentUserId)
  const timestamp = formatSidebarTimestamp(chat.recentMessage?.createdAt ?? chat.updatedAt)
  const preview = getRecentMessagePreview(chat, currentUserId)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-[24px] border px-3 py-3 text-left transition-all duration-200',
        isActive
          ? 'border-primary/30 bg-primary/10 shadow-[0_18px_40px_hsl(215_80%_58%_/_0.12)]'
          : 'border-transparent bg-transparent hover:border-border/50 hover:bg-background/65'
      )}
    >
      <div className="flex items-start gap-3">
        <ChatAvatar
          label={identity.avatarLabel}
          tone={identity.tone}
          online={identity.online}
          size="md"
          showPresence={identity.tone !== 'group'}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{identity.title}</p>
              {chat.type === 'ai' ? <Sparkles className="size-3.5 text-primary" /> : null}
              {chat.temporaryMode?.enabled ? <Lock className="size-3.5 text-temporary" /> : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <p className="truncate text-xs text-muted-foreground">{preview}</p>
            {chat.recentMessage?.senderId === currentUserId && chat.recentMessage?.status === 'seen' ? (
              <CheckCheck className="size-3.5 shrink-0 text-primary" />
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {chat.pinnedBy?.includes?.(currentUserId) ? <Pin className="size-3.5 text-primary" /> : null}
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                {identity.subtitle}
              </span>
            </div>

            {unread ? (
              <span className="flex min-w-6 items-center justify-center rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                New
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  )
}
