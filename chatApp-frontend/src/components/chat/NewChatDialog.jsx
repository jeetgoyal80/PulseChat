import { Search, Sparkles, UserPlus2 } from 'lucide-react'

import { ChatAvatar } from '@/components/chat/ChatAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function NewChatDialog({
  open,
  onOpenChange,
  searchTerm,
  onSearchChange,
  searchResults,
  onSelectUser,
  onSelectAi,
  error,
  loading,
}) {
  const canSelectAi = typeof onSelectAi === 'function'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[28px] border border-border/60 bg-card/96 p-0 shadow-[0_30px_80px_hsl(220_30%_3%_/_0.42)]">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <DialogTitle className="text-2xl">New Chat</DialogTitle>
          <DialogDescription>
            Search your contacts and open a new one-to-one conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {error ? (
            <Alert className="border border-destructive/30 bg-destructive/8">
              <AlertTitle>Couldn&apos;t start chat</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search contacts..."
              className="h-11 rounded-2xl border-border/70 bg-background/50 pl-11"
            />
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={canSelectAi ? onSelectAi : undefined}
              disabled={!canSelectAi}
              className={`flex w-full items-center gap-3 rounded-[22px] border border-primary/20 px-4 py-4 text-left transition ${
                canSelectAi
                  ? 'bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.12),transparent)] hover:border-primary/35 hover:bg-primary/10'
                  : 'bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.12),transparent)] opacity-80'
              }`}
            >
              <ChatAvatar label="AI" tone="ai" online size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">my.ai</p>
                  <Badge className="border border-primary/20 bg-primary/10 text-primary">
                    <Sparkles className="size-3.5" />
                    AI
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {canSelectAi
                    ? 'Open your always-on AI conversation.'
                    : 'Existing AI conversations stay available in your sidebar.'}
                </p>
              </div>
            </button>

            {searchResults.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => onSelectUser(person)}
                className="flex w-full items-center gap-3 rounded-[22px] border border-transparent bg-background/35 px-4 py-4 text-left transition hover:border-border/60 hover:bg-background/60"
              >
                <ChatAvatar
                  label={person.initials}
                  tone="direct"
                  online={Boolean(person.isOnline)}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{person.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {person.bio || person.email}
                  </p>
                </div>
                <UserPlus2 className="size-4 text-primary" />
              </button>
            ))}

            {!loading && searchResults.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-border/60 bg-background/35 px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No contacts found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a different name or email search.
                </p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-[22px] border border-border/60 bg-background/35 px-4 py-8 text-center text-sm text-muted-foreground">
                Searching contacts...
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
