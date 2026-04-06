import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from 'lucide-react'

import { PulseLogo } from '@/components/PulseLogo'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'

const showcaseCards = [
  {
    title: 'AI-native replies',
    description: 'Draft, summarize, and translate without leaving the thread.',
    icon: WandSparkles,
  },
  {
    title: 'Temporary spaces',
    description: 'Spin up privacy-first conversations with distinct visual cues.',
    icon: Clock3,
  },
  {
    title: 'Realtime presence',
    description: 'Session-backed sockets keep typing and online states accurate.',
    icon: Zap,
  },
]

const trustPoints = [
  {
    title: 'Session cookie auth',
    description: 'Every request and realtime event is backed by express-session.',
    icon: ShieldCheck,
  },
  {
    title: 'OTP onboarding',
    description: 'Registration flows directly into your backend email verification step.',
    icon: KeyRound,
  },
  {
    title: 'Deep dark UI',
    description: 'Shared tokens, gradients, and surface layers ready for the full product.',
    icon: Sparkles,
  },
]

const initialLogin = {
  email: '',
  password: '',
}

const initialRegister = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const initialVerify = {
  email: '',
  otp: '',
}

const initialForgot = {
  email: '',
}

const initialReset = {
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
}

function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground/90">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-12 rounded-2xl border-border/70 bg-background/70 px-4 text-sm text-foreground placeholder:text-muted-foreground/80 focus-visible:border-primary"
      />
    </div>
  )
}

export function AuthPage() {
  const navigate = useNavigate()
  const {
    authError,
    clearPasswordResetRequest,
    clearPendingVerification,
    forgotPassword,
    isAuthenticated,
    isProcessing,
    login,
    passwordResetRequest,
    pendingVerification,
    register,
    resetPassword,
    setAuthError,
    verifyEmail,
  } = useAuth()

  const [tab, setTab] = useState('login')
  const [panel, setPanel] = useState(() => {
    if (pendingVerification?.email) return 'verify'
    if (passwordResetRequest?.email) return 'reset'
    return 'auth'
  })

  const [statusMessage, setStatusMessage] = useState('')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [registerForm, setRegisterForm] = useState(initialRegister)
  const [verifyForm, setVerifyForm] = useState({
    ...initialVerify,
    email: pendingVerification?.email ?? '',
  })
  const [forgotForm, setForgotForm] = useState({
    ...initialForgot,
    email: passwordResetRequest?.email ?? '',
  })
  const [resetForm, setResetForm] = useState({
    ...initialReset,
    email: passwordResetRequest?.email ?? '',
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (pendingVerification?.email) {
      setPanel('verify')
      setVerifyForm((current) => ({
        ...current,
        email: pendingVerification.email,
      }))
      setStatusMessage('We sent your verification code. Enter it below to create your session.')
    }
  }, [pendingVerification])

  useEffect(() => {
    if (passwordResetRequest?.email) {
      setPanel('reset')
      setForgotForm({ email: passwordResetRequest.email })
      setResetForm((current) => ({
        ...current,
        email: passwordResetRequest.email,
      }))
      setStatusMessage('Your reset OTP is on the way. Enter it with your new password.')
    }
  }, [passwordResetRequest])

  const welcomeCopy = useMemo(() => {
    if (panel === 'verify') {
      return {
        title: 'Verify your email',
        description: 'One last step before your chat workspace opens.',
      }
    }

    if (panel === 'reset') {
      return {
        title: 'Reset your password',
        description: 'Use the OTP from your inbox to set a fresh password.',
      }
    }

    return {
      title: 'Sign in to Pulse',
      description:
        'A refined messaging experience with privacy, AI, and realtime collaboration built in.',
    }
  }, [panel])

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthError('')
    setStatusMessage('')

    try {
      await login(loginForm)
      navigate('/app', { replace: true })
    } catch (error) {
      if (error.message.toLowerCase().includes('verify your email')) {
        setPanel('verify')
        setVerifyForm((current) => ({
          ...current,
          email: loginForm.email,
        }))
        setStatusMessage('Your account exists, but it still needs OTP verification.')
      }
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setAuthError('')
    setStatusMessage('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    await register({
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
    })

    setVerifyForm({
      email: registerForm.email.trim(),
      otp: '',
    })
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setAuthError('')
    setStatusMessage('')

    await verifyEmail({
      email: verifyForm.email.trim(),
      otp: verifyForm.otp.trim(),
    })

    navigate('/app', { replace: true })
  }

  const handleForgotPassword = async (event) => {
    event.preventDefault()
    setAuthError('')
    setStatusMessage('')

    await forgotPassword({
      email: forgotForm.email.trim(),
    })

    setResetForm((current) => ({
      ...current,
      email: forgotForm.email.trim(),
    }))
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setAuthError('')
    setStatusMessage('')

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setAuthError('New passwords do not match.')
      return
    }

    await resetPassword({
      email: resetForm.email.trim(),
      otp: resetForm.otp.trim(),
      newPassword: resetForm.newPassword,
    })

    setPanel('auth')
    setTab('login')
    setLoginForm((current) => ({
      ...current,
      email: resetForm.email.trim(),
    }))
    setResetForm(initialReset)
    clearPasswordResetRequest()
    setStatusMessage('Password updated. You can sign in right away.')
  }

  const resetToAuth = () => {
    setPanel('auth')
    setStatusMessage('')
    setAuthError('')
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(215_80%_58%_/_0.18),transparent_32%),radial-gradient(circle_at_75%_20%,hsl(280_60%_55%_/_0.15),transparent_24%),linear-gradient(135deg,hsl(220_15%_8%),hsl(220_16%_6%))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-6 md:px-10">
        <header className="flex items-center justify-between">
          <PulseLogo />
          <Badge className="hidden border border-border/60 bg-secondary/60 px-3 py-1 text-muted-foreground md:inline-flex">
            Auth Phase
          </Badge>
        </header>

        <section className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <Badge className="border border-primary/20 bg-primary/12 px-3 py-1 text-primary">
                <Sparkles className="size-3.5" />
                Secure messaging, reimagined
              </Badge>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-foreground md:text-6xl xl:text-7xl">
                  Deep-focus chats with a <span className="text-gradient">cookie-authenticated</span>{' '}
                  core.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-secondary-foreground md:text-lg">
                  Pulse blends the calm, dark aesthetic from your mockups with session-backed auth,
                  realtime presence, and room for the chat workspace we&apos;ll build next.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {showcaseCards.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="glass surface-outline rounded-[26px] border border-border/60 bg-surface-1/75 p-5"
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <Card className="glass surface-outline rounded-[32px] border border-border/60 bg-surface-1/75 py-0">
              <CardContent className="grid gap-6 px-6 py-6 md:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[28px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--surface-2)),hsl(var(--surface-1)))] p-5">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-rose-400/80" />
                    <span className="size-2.5 rounded-full bg-amber-400/80" />
                    <span className="size-2.5 rounded-full bg-online/80" />
                    <span className="ml-3 text-xs text-muted-foreground">Pulse workspace preview</span>
                  </div>

                  <div className="grid gap-3">
                    {['Sarah Chen', 'my.ai', 'Design Team'].map((item, index) => (
                      <div
                        key={item}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                          index === 0 ? 'border-primary/30 bg-primary/10' : 'border-border/50 bg-background/70'
                        }`}
                      >
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-sm font-semibold text-foreground">
                          {item === 'my.ai' ? 'AI' : item.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item}</p>
                          <p className="text-xs text-muted-foreground">
                            {index === 0
                              ? 'Latest message preview'
                              : index === 1
                                ? 'Always available assistant'
                                : 'Group chat overview'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-[28px] border border-border/60 bg-background/60 p-5">
                  <div className="ml-auto w-fit rounded-[22px] bg-chat-outgoing px-4 py-3 text-sm text-primary-foreground shadow-[0_12px_30px_hsl(215_80%_58%_/_0.18)]">
                    Ready when you are. Let&apos;s make this frontend feel premium.
                  </div>
                  <div className="max-w-md rounded-[22px] border border-border/60 bg-chat-incoming px-4 py-4 text-sm leading-7 text-foreground">
                    Session cookies are active, OTP onboarding is ready, and the UI tokens now match
                    your dark Pulse palette.
                  </div>
                  <div className="rounded-[24px] border border-border/60 bg-secondary/70 px-4 py-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MessageSquareText className="size-4 text-primary" />
                      my.ai suggestions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Summarize', 'Plan my day', 'Translate'].map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-secondary-foreground"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass surface-outline mx-auto w-full max-w-xl rounded-[32px] border border-border/60 bg-card/85 py-0">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-2">
                <Badge className="border border-border/60 bg-secondary/70 px-3 py-1 text-muted-foreground">
                  <Mail className="size-3.5" />
                  Phase 1 auth foundation
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">{welcomeCopy.title}</h2>
                <p className="text-sm leading-7 text-muted-foreground md:text-base">
                  {welcomeCopy.description}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {statusMessage ? (
                  <Alert className="border border-primary/25 bg-primary/10 text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    <AlertTitle>Heads up</AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                  </Alert>
                ) : null}

                {authError ? (
                  <Alert variant="destructive" className="border border-destructive/20 bg-destructive/8">
                    <LockKeyhole className="size-4" />
                    <AlertTitle>Action needed</AlertTitle>
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              {panel === 'auth' ? (
                <Tabs value={tab} onValueChange={setTab} className="mt-8">
                  <TabsList className="grid h-12 grid-cols-2 rounded-2xl border border-border/60 bg-secondary/60 p-1">
                    <TabsTrigger value="login" className="rounded-[14px]">
                      Sign in
                    </TabsTrigger>
                    <TabsTrigger value="register" className="rounded-[14px]">
                      Create account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-6">
                    <form className="space-y-5" onSubmit={handleLogin}>
                      <Field
                        id="login-email"
                        label="Email"
                        type="email"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="you@company.com"
                        autoComplete="email"
                      />
                      <Field
                        id="login-password"
                        label="Password"
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />

                      <Button type="submit" size="lg" className="h-12 w-full rounded-2xl text-sm" disabled={isProcessing}>
                        {isProcessing ? 'Signing in...' : 'Enter Pulse'}
                        <ArrowRight className="size-4" />
                      </Button>
                    </form>

                    <button
                      type="button"
                      className="mt-4 text-sm text-primary transition hover:text-primary/80"
                      onClick={() => {
                        setPanel('reset')
                        setResetForm((current) => ({
                          ...current,
                          email: loginForm.email,
                        }))
                      }}
                    >
                      Forgot your password?
                    </button>
                  </TabsContent>

                  <TabsContent value="register" className="mt-6">
                    <form className="space-y-5" onSubmit={handleRegister}>
                      <Field
                        id="register-name"
                        label="Full name"
                        value={registerForm.name}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Sarah Chen"
                        autoComplete="name"
                      />
                      <Field
                        id="register-email"
                        label="Email"
                        type="email"
                        value={registerForm.email}
                        onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="you@company.com"
                        autoComplete="email"
                      />
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                          id="register-password"
                          label="Password"
                          type="password"
                          value={registerForm.password}
                          onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                          placeholder="Create password"
                          autoComplete="new-password"
                        />
                        <Field
                          id="register-confirm-password"
                          label="Confirm password"
                          type="password"
                          value={registerForm.confirmPassword}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, confirmPassword: event.target.value }))
                          }
                          placeholder="Repeat password"
                          autoComplete="new-password"
                        />
                      </div>

                      <Button type="submit" size="lg" className="h-12 w-full rounded-2xl text-sm" disabled={isProcessing}>
                        {isProcessing ? 'Sending OTP...' : 'Create account'}
                        <ArrowRight className="size-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : null}

              {panel === 'verify' ? (
                <form className="mt-8 space-y-5" onSubmit={handleVerify}>
                  <Field
                    id="verify-email"
                    label="Email"
                    type="email"
                    value={verifyForm.email}
                    onChange={(event) => setVerifyForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                  <Field
                    id="verify-otp"
                    label="Verification code"
                    value={verifyForm.otp}
                    onChange={(event) => setVerifyForm((current) => ({ ...current, otp: event.target.value }))}
                    placeholder="Enter the 6-digit OTP"
                    autoComplete="one-time-code"
                  />

                  <Button type="submit" size="lg" className="h-12 w-full rounded-2xl text-sm" disabled={isProcessing}>
                    {isProcessing ? 'Verifying...' : 'Verify and continue'}
                    <ArrowRight className="size-4" />
                  </Button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <button
                      type="button"
                      className="text-muted-foreground transition hover:text-foreground"
                      onClick={() => {
                        clearPendingVerification()
                        resetToAuth()
                        setTab('register')
                      }}
                    >
                      Back to registration
                    </button>
                    <button
                      type="button"
                      className="text-primary transition hover:text-primary/80"
                      onClick={() => {
                        resetToAuth()
                        setTab('login')
                      }}
                    >
                      Try signing in instead
                    </button>
                  </div>
                </form>
              ) : null}

              {panel === 'reset' ? (
                <div className="mt-8 space-y-6">
                  <form className="space-y-5" onSubmit={handleForgotPassword}>
                    <Field
                      id="forgot-email"
                      label="Email for reset OTP"
                      type="email"
                      value={forgotForm.email}
                      onChange={(event) => setForgotForm({ email: event.target.value })}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />

                    <Button type="submit" variant="secondary" size="lg" className="h-12 w-full rounded-2xl" disabled={isProcessing}>
                      {isProcessing ? 'Sending...' : 'Send reset code'}
                    </Button>
                  </form>

                  <div className="h-px bg-border/70" />

                  <form className="space-y-5" onSubmit={handleResetPassword}>
                    <Field
                      id="reset-email"
                      label="Email"
                      type="email"
                      value={resetForm.email}
                      onChange={(event) => setResetForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                    <Field
                      id="reset-otp"
                      label="Reset OTP"
                      value={resetForm.otp}
                      onChange={(event) => setResetForm((current) => ({ ...current, otp: event.target.value }))}
                      placeholder="Enter the OTP"
                      autoComplete="one-time-code"
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        id="reset-new-password"
                        label="New password"
                        type="password"
                        value={resetForm.newPassword}
                        onChange={(event) =>
                          setResetForm((current) => ({ ...current, newPassword: event.target.value }))
                        }
                        placeholder="New password"
                        autoComplete="new-password"
                      />
                      <Field
                        id="reset-confirm-password"
                        label="Confirm password"
                        type="password"
                        value={resetForm.confirmPassword}
                        onChange={(event) =>
                          setResetForm((current) => ({ ...current, confirmPassword: event.target.value }))
                        }
                        placeholder="Confirm password"
                        autoComplete="new-password"
                      />
                    </div>

                    <Button type="submit" size="lg" className="h-12 w-full rounded-2xl text-sm" disabled={isProcessing}>
                      {isProcessing ? 'Updating password...' : 'Reset password'}
                      <ArrowRight className="size-4" />
                    </Button>
                  </form>

                  <button
                    type="button"
                    className="text-sm text-muted-foreground transition hover:text-foreground"
                    onClick={() => {
                      clearPasswordResetRequest()
                      resetToAuth()
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : null}

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {trustPoints.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-2xl border border-border/60 bg-background/55 p-4">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
