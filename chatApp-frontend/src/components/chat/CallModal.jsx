import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Video,
  X,
} from 'lucide-react'

import { ChatAvatar } from '@/components/chat/ChatAvatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const phaseCopy = {
  calling: {
    voice: 'Voice call • Ringing',
    video: 'Video call • Ringing',
  },
  incoming: {
    voice: 'Incoming voice call',
    video: 'Incoming video call',
  },
  active: {
    voice: 'Voice call • Live',
    video: 'Video call • Live',
  },
  ended: {
    voice: 'Voice call ended',
    video: 'Video call ended',
  },
}

export function CallModal({
  callState,
  onAccept,
  onDecline,
  onEnd,
  onClose,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}) {
  const open = callState.open

  if (!open) {
    return null
  }

  const title = callState.peer?.name || 'Pulse call'
  const mode = callState.type === 'video' ? 'video' : 'voice'
  const status = phaseCopy[callState.phase]?.[mode] || 'Connecting...'

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <DialogContent
        showCloseButton={false}
        className="h-screen w-screen max-w-none rounded-none border-0 bg-[linear-gradient(180deg,hsl(220_15%_8%),hsl(220_16%_7%))] p-0 text-foreground ring-0"
      >
        <div className="relative flex h-full flex-col overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(215_80%_58%_/_0.12),transparent_28%),radial-gradient(circle_at_75%_15%,hsl(280_60%_55%_/_0.08),transparent_20%)]" />

          <div className="relative flex items-start justify-between p-6 md:p-8">
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-full bg-background/35 text-muted-foreground hover:bg-background/60"
              onClick={callState.phase === 'active' ? onClose : onDecline}
            >
              <X className="size-5" />
            </Button>

            {mode === 'video' ? (
              <div className="flex h-36 w-28 items-center justify-center rounded-[24px] border border-border/60 bg-card/70 text-xs text-muted-foreground shadow-[0_20px_40px_hsl(220_30%_3%_/_0.22)] md:h-44 md:w-32">
                Your camera
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ChatAvatar
              label={callState.peer?.avatarLabel || 'PU'}
              tone={callState.peer?.tone || 'direct'}
              online
              size="lg"
              className="scale-[1.65] md:scale-[1.85]"
            />

            <h2 className="mt-14 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {title}
            </h2>
            <p className="mt-3 text-sm text-primary md:text-base">{status}</p>

            {callState.error ? (
              <p className="mt-2 text-sm text-destructive">{callState.error}</p>
            ) : null}
          </div>

          <div className="relative flex justify-center px-6 pb-10 md:pb-14">
            {callState.phase === 'incoming' ? (
              <div className="flex items-center gap-4">
                <Button
                  size="icon-lg"
                  className="size-16 rounded-full bg-online text-white hover:bg-online/90"
                  onClick={onAccept}
                >
                  <PhoneIncoming className="size-5" />
                </Button>
                <Button
                  size="icon-lg"
                  className="size-16 rounded-full bg-destructive text-white hover:bg-destructive/90"
                  onClick={onDecline}
                >
                  <PhoneOff className="size-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <CircleAction
                  active={callState.muted}
                  onClick={onToggleMute}
                  icon={callState.muted ? MicOff : Mic}
                />
                {mode === 'video' ? (
                  <CircleAction
                    active={callState.cameraDisabled}
                    onClick={onToggleCamera}
                    icon={callState.cameraDisabled ? CameraOff : Camera}
                  />
                ) : null}
                <CircleAction onClick={onToggleScreenShare} icon={Monitor} />
                <CircleAction onClick={onClose} icon={Minimize2} />
                <Button
                  size="icon-lg"
                  className={cn(
                    'size-16 rounded-full bg-destructive text-white hover:bg-destructive/90',
                    callState.phase === 'calling' && 'animate-pulse'
                  )}
                  onClick={onEnd}
                >
                  {callState.phase === 'calling' ? (
                    <PhoneOutgoing className="size-5" />
                  ) : mode === 'video' ? (
                    <Video className="size-5" />
                  ) : (
                    <PhoneOff className="size-5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CircleAction({ active = false, icon: Icon, onClick }) {
  return (
    <Button
      size="icon-lg"
      variant="ghost"
      className={cn(
        'size-14 rounded-full bg-background/35 text-foreground hover:bg-background/55',
        active && 'bg-primary/20 text-primary'
      )}
      onClick={onClick}
    >
      <Icon className="size-5" />
    </Button>
  )
}
