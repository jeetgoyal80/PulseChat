import { Ban, ShieldCheck } from 'lucide-react'

import { ChatAvatar } from '@/components/chat/ChatAvatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

const privacyFields = [
  {
    key: 'showLastSeen',
    label: 'Show last seen',
    description: 'Let other people know when you were last active.',
  },
  {
    key: 'showOnlineStatus',
    label: 'Show online status',
    description: 'Display your live presence dot across conversations.',
  },
  {
    key: 'showTypingIndicator',
    label: 'Show typing indicator',
    description: 'Broadcast when you are actively composing a message.',
  },
]

export function SettingsDialog({
  open,
  onOpenChange,
  privacy,
  onTogglePrivacy,
  savingPrivacy,
  activeChatIdentity,
  blockedUsers,
  activeDirectParticipant,
  onToggleBlock,
  blockingInProgress,
  error,
}) {
  const isBlocked = blockedUsers.some((person) => person.id === activeDirectParticipant?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[30px] border border-border/60 bg-card/96 p-0 shadow-[0_30px_80px_hsl(220_30%_3%_/_0.42)]">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="text-2xl">Privacy & Settings</DialogTitle>
          <DialogDescription>
            Update your privacy preferences and manage this conversation safely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-6">
          {error ? (
            <Alert className="border border-destructive/20 bg-destructive/8">
              <AlertTitle>Settings issue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section className="rounded-[26px] border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Privacy controls</h3>
                <p className="text-sm text-muted-foreground">
                  Settings save instantly to `PUT /users/settings/privacy`.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {privacyFields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-border/60 bg-card/65 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{field.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{field.description}</p>
                  </div>
                  <Switch
                    checked={Boolean(privacy[field.key])}
                    onCheckedChange={(checked) => onTogglePrivacy(field.key, checked)}
                    disabled={savingPrivacy}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-border/60 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Conversation safety</h3>
                <p className="text-sm text-muted-foreground">
                  Manage how you interact with this chat.
                </p>
              </div>
              <Badge className="border border-border/60 bg-secondary/60 text-muted-foreground">
                {activeChatIdentity?.title || 'Conversation'}
              </Badge>
            </div>

            {activeDirectParticipant ? (
              <div className="mt-4 rounded-[22px] border border-border/60 bg-card/65 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ChatAvatar
                      label={activeChatIdentity?.avatarLabel}
                      tone={activeChatIdentity?.tone}
                      online={activeChatIdentity?.online}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-foreground">{activeDirectParticipant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {isBlocked ? 'Currently blocked' : 'Tap to block if needed'}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant={isBlocked ? 'outline' : 'destructive'}
                    onClick={onToggleBlock}
                    disabled={blockingInProgress}
                  >
                    <Ban className="size-4" />
                    {blockingInProgress ? 'Saving...' : isBlocked ? 'Unblock' : 'Block'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-border/60 bg-card/65 px-4 py-4 text-sm text-muted-foreground">
                Blocking is available for direct chats. Group and AI chats don’t expose that control.
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-border/60 bg-background/40 p-4">
            <h3 className="font-semibold text-foreground">Blocked users</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pulled from `GET /users/blocked`.
            </p>

            <div className="mt-4 space-y-2">
              {blockedUsers.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-[22px] border border-border/60 bg-card/65 px-4 py-3"
                >
                  <ChatAvatar label={person.initials} tone="direct" size="sm" showPresence={false} />
                  <p className="font-medium text-foreground">{person.name}</p>
                </div>
              ))}

              {blockedUsers.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border/60 bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  No blocked users right now.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
