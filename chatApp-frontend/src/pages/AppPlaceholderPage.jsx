import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, LogOut, Radio, ShieldCheck } from 'lucide-react'

import { PulseLogo } from '@/components/PulseLogo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/lib/socket'

export function AppPlaceholderPage() {
  const { logout, user } = useAuth()
  const { isConnected, socketError } = useSocket()

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="glass surface-outline flex flex-col gap-6 rounded-[28px] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <PulseLogo />
            <div className="space-y-2">
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                Phase 1 Complete
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Signed in as <span className="text-gradient">{user?.name}</span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                The auth foundation is live, cookie-backed requests are configured, and the Socket.IO
                client is ready for the chat shell in Phase 2.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="border-border/70 bg-background/60 text-foreground hover:bg-muted"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </header>

        <section className="grid gap-5 md:grid-cols-[1.25fr_0.75fr]">
          <Card className="glass surface-outline rounded-[28px] border border-border/60 bg-surface-1/80 py-0">
            <CardHeader className="border-b border-border/60 py-6">
              <CardTitle>What is already wired</CardTitle>
              <CardDescription>
                This placeholder page closes the auth loop cleanly before the chat workspace lands in
                Phase 2.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 py-6 md:grid-cols-2">
              {[
                'Axios uses withCredentials: true on every request.',
                'Socket.IO initializes with withCredentials: true.',
                'Register, verify-email, login, forgot, and reset flows are connected.',
                'The frontend is pinned to your localhost backend URLs exactly as requested.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-secondary-foreground"
                >
                  <div className="mb-3 flex size-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <CheckCircle2 className="size-4" />
                  </div>
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="glass surface-outline rounded-[28px] border border-border/60 bg-surface-2/80 py-0">
              <CardHeader className="py-6">
                <CardTitle>Realtime session</CardTitle>
                <CardDescription>Live status from the credentialed socket client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-2.5 rounded-full ${
                        isConnected ? 'bg-online shadow-[0_0_0_6px_hsl(var(--online)_/_0.15)]' : 'bg-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isConnected ? 'Connected' : 'Waiting for socket'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {socketError || 'Your session cookie will authenticate future chat events.'}
                      </p>
                    </div>
                  </div>
                  <Radio className="size-4 text-primary" />
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-secondary-foreground">
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <ShieldCheck className="size-4" />
                    Express-session protected
                  </div>
                  Socket connections will automatically clear stale frontend auth if the backend
                  rejects the session.
                </div>
              </CardContent>
            </Card>

            <Card className="glass rounded-[28px] border border-border/60 bg-surface-1/80 py-0">
              <CardHeader className="py-6">
                <CardTitle>Next stop</CardTitle>
                <CardDescription>Phase 2 replaces this page with the actual chat workspace.</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <Button asChild size="lg" className="w-full">
                  <Link to="/auth">
                    Review auth flow
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
