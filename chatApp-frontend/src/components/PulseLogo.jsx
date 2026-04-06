import { MessageCircleMore } from 'lucide-react'

import { cn } from '@/lib/utils'

export function PulseLogo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--temporary)))] shadow-[0_18px_48px_hsl(215_80%_58%_/_0.28)]">
        <MessageCircleMore className="size-5 text-white" />
      </div>
      {!compact ? (
        <div className="space-y-0.5">
          <p className="text-lg font-semibold tracking-tight text-foreground">Pulse</p>
          <p className="text-xs text-muted-foreground">Private conversations, beautifully crafted</p>
        </div>
      ) : null}
    </div>
  )
}
