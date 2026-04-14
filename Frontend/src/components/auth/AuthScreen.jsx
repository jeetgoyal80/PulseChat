import { useEffect, useRef, useState } from 'react';

const initialForms = {
  login: { email: '', password: '' },
  register: { name: '', email: '', password: '' },
  verify: { email: '', otp: '' },
  forgot: { email: '' },
  reset: { email: '', otp: '', newPassword: '' },
};

const modes = [
  { key: 'login', label: 'Sign In' },
  { key: 'register', label: 'Create Account' },
  { key: 'verify', label: 'Verify Email' },
  { key: 'forgot', label: 'Forgot Password' },
  { key: 'reset', label: 'Reset Password' },
];

const Field = ({ label, type = 'text', value, onChange, placeholder, inputRef }) => (
  <label className="block space-y-2">
    <span className="text-sm text-foreground">{label}</span>
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl bg-surface-1 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
    />
  </label>
);

const OtpInputs = ({ value, onChange }) => {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  return (
    <div className="space-y-2">
      <span className="text-sm text-foreground">OTP</span>
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            inputMode="numeric"
            maxLength={1}
            value={digit.trim()}
            onChange={(event) => {
              const nextDigit = event.target.value.replace(/\D/g, '').slice(-1);
              const next = value.padEnd(6, ' ').slice(0, 6).split('');
              next[index] = nextDigit;
              onChange(next.join('').trim());
              if (nextDigit && index < 5) refs.current[index + 1]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
                refs.current[index - 1]?.focus();
              }
            }}
            className="w-12 h-12 rounded-xl bg-surface-1 border border-border/50 text-center text-lg font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        ))}
      </div>
    </div>
  );
};

const AuthScreen = ({ loading, error, authView, cooldown, onSubmit, onResendOtp, onModeChange }) => {
  const [mode, setMode] = useState(authView?.mode || 'login');
  const [forms, setForms] = useState(initialForms);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (!authView) return;
    setMode(authView.mode);
    setForms((current) => ({
      ...current,
      [authView.mode]: {
        ...current[authView.mode],
        ...(authView.email ? { email: authView.email } : {}),
      },
    }));
  }, [authView]);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [mode]);

  const updateField = (section, field, value) => {
    setForms((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const currentForm = forms[mode];

  const changeMode = (nextMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode, forms[nextMode]?.email || forms.verify.email || forms.register.email || forms.login.email);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(mode, currentForm);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-card/95 border border-border/50 shadow-lg p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pulse</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with your session-backed account to load chats, calls, presence, temporary mode, and AI conversations.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {modes.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => changeMode(item.key)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                mode === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <Field
              label="Name"
              value={currentForm.name}
              onChange={(event) => updateField('register', 'name', event.target.value)}
              placeholder="Your name"
            />
          )}

          <Field
            inputRef={emailInputRef}
            label="Email"
            type="email"
            value={currentForm.email}
            onChange={(event) => updateField(mode, 'email', event.target.value)}
            placeholder="name@example.com"
          />

          {(mode === 'login' || mode === 'register') && (
            <Field
              label="Password"
              type="password"
              value={currentForm.password}
              onChange={(event) => updateField(mode, 'password', event.target.value)}
              placeholder="Enter password"
            />
          )}

          {(mode === 'verify' || mode === 'reset') && (
            <OtpInputs
              value={currentForm.otp}
              onChange={(nextOtp) => updateField(mode, 'otp', nextOtp)}
            />
          )}

          {mode === 'reset' && (
            <Field
              label="New Password"
              type="password"
              value={currentForm.newPassword}
              onChange={(event) => updateField('reset', 'newPassword', event.target.value)}
              placeholder="Create a new password"
            />
          )}

          {mode === 'verify' && (
            <div className="rounded-xl bg-surface-1 border border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <div>Enter the 6-digit code sent to <span className="text-foreground font-medium">{currentForm.email}</span>.</div>
              <button
                type="button"
                onClick={() => onResendOtp(currentForm.email)}
                disabled={loading || cooldown > 0}
                className="mt-2 text-primary disabled:text-muted-foreground"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          )}

          {error && <div className="rounded-xl bg-destructive/10 text-destructive text-sm px-4 py-3">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Please wait...' : modes.find((item) => item.key === mode)?.label}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
