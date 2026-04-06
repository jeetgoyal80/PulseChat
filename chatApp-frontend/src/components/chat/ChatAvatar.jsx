import { Bot, Sparkles, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'size-10 text-xs',
  md: 'size-12 text-sm',
  lg: 'size-14 text-base',
}

const dotClasses = {
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-3.5',
}

export function ChatAvatar({
  label,
  tone = 'direct',
  online = false,
  size = 'md',
  showPresence = true,
  className,
}) {
  const Icon = tone === 'ai' ? Bot : tone === 'group' ? Users : null

  return (
    <div className={cn('relative shrink-0', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-[22px] border font-semibold tracking-wide text-foreground',
          sizeClasses[size],
          tone === 'ai' &&
            'border-primary/25 bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.8),hsl(var(--temporary)_/_0.85))] text-white shadow-[0_14px_40px_hsl(215_80%_58%_/_0.25)]',
          tone === 'group' && 'border-border/70 bg-secondary text-secondary-foreground',
          tone === 'direct' && 'border-border/70 bg-background/90 text-foreground'
        )}
      >
        {Icon ? (
          <span className="relative flex items-center justify-center">
            <Icon className={cn(size === 'lg' ? 'size-6' : 'size-5')} />
            {tone === 'ai' ? <Sparkles className="absolute -right-1 -top-1 size-3.5" /> : null}
          </span>
        ) : (
          <span>{label}</span>
        )}
      </div>

      {showPresence ? (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-sidebar-background',
            dotClasses[size],
            online ? 'bg-online' : 'bg-muted'
          )}
        />
      ) : null}
    </div>
  )
}
