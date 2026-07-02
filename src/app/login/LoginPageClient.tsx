'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resendSignupConfirmation, requestPasswordReset } from '@/lib/actions/auth';
import { BRAND_TAGLINE, TAGLINE, AI_EMPLOYEE_NAME } from '@/lib/constants';
import { type LoginMode } from '@/lib/auth/login-url';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { SunnyMascot } from '@/components/brand/SunnyAvatar';
import { SignUpLegalNotice } from '@/components/marketing/LegalPolicyLinks';
import { ArrowRight, Check, Lock, User, Users, Zap } from 'lucide-react';

type AuthMode = LoginMode;

function isSuccessMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('check your email') ||
    lower.includes('reset link') ||
    lower.includes('confirmation email') ||
    lower.includes('account created') ||
    lower.includes('sign in with your email') ||
    lower.includes('already confirmed') ||
    lower.includes('confirmation is complete') ||
    lower.includes('account ready')
  );
}

function isRateLimitMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('too many confirmation emails') || lower.includes('rate limit');
}

const MODE_COPY: Record<
  AuthMode,
  { title: string; subtitle: string; cta: string; loading: string }
> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to your AI employee.',
    cta: 'Continue',
    loading: 'Signing in…',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Free to start. No credit card required.',
    cta: 'Get started',
    loading: 'Creating account…',
  },
  forgot: {
    title: 'Reset password',
    subtitle: 'We’ll email you a secure link.',
    cta: 'Send reset link',
    loading: 'Sending…',
  },
};

function FormField({
  id,
  name,
  label,
  type = 'text',
  required,
  minLength,
  autoComplete,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="auth-input"
      />
    </div>
  );
}

function PlanPicker({
  selected,
  onSelect,
}: {
  selected: 'free' | 'pro';
  onSelect: (plan: 'free' | 'pro') => void;
}) {
  const options = [
    {
      id: 'free' as const,
      icon: User,
      name: 'Free',
      detail: '$0 · 1 client project',
    },
    {
      id: 'pro' as const,
      icon: Zap,
      name: 'Pro',
      detail: '$39/mo · unlimited projects',
    },
  ];

  return (
    <div className="mt-5" role="radiogroup" aria-label="Choose your plan">
      <p className="auth-label">Choose your plan</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const isSelected = selected === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={`relative rounded-xl border px-3.5 py-3 text-left transition-colors ${
                isSelected
                  ? 'border-[var(--ud-graphite,#1f2937)] bg-gray-900/[0.04] ring-1 ring-[var(--ud-graphite,#1f2937)]'
                  : 'border-gray-200 bg-white/60 hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ud-graphite,#1f2937)] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <Icon className="h-4.5 w-4.5 text-gray-700" strokeWidth={2} />
              <p className="mt-1.5 text-[14px] font-semibold text-gray-900">{option.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{option.detail}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs marketing-text-muted">
        {selected === 'pro'
          ? 'You’ll continue to secure checkout after creating your account.'
          : 'No credit card required. Upgrade anytime.'}
      </p>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.21 7.21 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function GoogleAuthForm({
  redirect,
  checkoutPlan,
  onSubmit,
}: {
  redirect: string;
  checkoutPlan: 'pro' | 'pro-annual' | null;
  onSubmit: () => void;
}) {
  return (
    <form action="/api/auth/google" method="POST" onSubmit={onSubmit} className="mt-6">
      <input type="hidden" name="redirect" value={redirect} />
      {checkoutPlan && <input type="hidden" name="plan" value={checkoutPlan} />}
      <button type="submit" className="auth-social-btn">
        <GoogleLogo />
        Continue with Google
      </button>
    </form>
  );
}

function ModeTabs({
  mode,
  onSwitchMode,
}: {
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  if (mode === 'forgot') return null;

  return (
    <div className="auth-mode-tabs" role="tablist" aria-label="Authentication mode">
      <button
        type="button"
        onClick={() => onSwitchMode('signin')}
        role="tab"
        aria-selected={mode === 'signin'}
        className={mode === 'signin' ? 'auth-mode-tab auth-mode-tab-active' : 'auth-mode-tab'}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => onSwitchMode('signup')}
        role="tab"
        aria-selected={mode === 'signup'}
        className={mode === 'signup' ? 'auth-mode-tab auth-mode-tab-active' : 'auth-mode-tab'}
      >
        Sign up
      </button>
    </div>
  );
}

function GlassStatCard({
  label,
  value,
  sub,
  dark = false,
  className = '',
}: {
  label: string;
  value: string;
  sub?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${dark ? 'auth-glass-card-dark' : 'auth-glass-card'} px-4 py-3.5 ${className}`}
    >
      <p className={`text-[11px] font-medium uppercase tracking-wider ${dark ? 'text-white/55' : 'marketing-text-muted'}`}>
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tracking-tight ${dark ? 'text-white' : 'text-[var(--ud-graphite)]'}`}>
        {value}
      </p>
      {sub && (
        <p className={`mt-0.5 text-xs ${dark ? 'text-white/45' : 'marketing-text-muted'}`}>{sub}</p>
      )}
    </div>
  );
}

function AuthMessage({
  message,
  mode,
  onSwitchMode,
  onResendConfirmation,
}: {
  message: string;
  mode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
  onResendConfirmation?: () => void;
}) {
  return (
    <div
      className={`auth-alert ${
        isSuccessMessage(message)
          ? 'auth-alert-success'
          : isRateLimitMessage(message)
            ? 'auth-alert-warn'
            : 'auth-alert-error'
      }`}
    >
      <p>{message}</p>
      {mode === 'signup' && message.includes('already exists') && (
        <button type="button" onClick={() => onSwitchMode('signin')} className="auth-link mt-2">
          Go to sign in
        </button>
      )}
      {isRateLimitMessage(message) && (
        <p className="mt-2 text-[13px] opacity-90">
          If you already created an account, try signing in. Otherwise wait about an hour and try
          again.
        </p>
      )}
      {mode === 'signin' &&
        onResendConfirmation &&
        (message.toLowerCase().includes('confirm') ||
          message.includes('Incorrect email or password')) && (
          <button type="button" onClick={onResendConfirmation} className="auth-link mt-2">
            Resend confirmation email
          </button>
        )}
    </div>
  );
}

export default function LoginPageClient({
  mode: initialMode,
  authError = false,
  checkoutPlan = null,
  initialMessage,
}: {
  mode: AuthMode;
  authError?: boolean;
  checkoutPlan?: 'pro' | 'pro-annual' | null;
  initialMessage?: string;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // Re-sync if a real navigation lands on /login with a different mode param
  // (the page component doesn't remount when only searchParams change).
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
  }
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [message, setMessage] = useState(initialMessage ?? '');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  const hasCheckoutPlan = checkoutPlan === 'pro' || checkoutPlan === 'pro-annual';
  const copy = MODE_COPY[mode];

  // Swap modes in place (no navigation) so the page doesn't remount and the
  // scroll position stays put — switching tabs on mobile was jumping the screen.
  function switchMode(next: AuthMode) {
    if (next === mode) return;
    setMode(next);
    setMessage('');
    const params = new URLSearchParams();
    // Always write mode explicitly so a reload keeps the tab, even with a plan deep link.
    if (next !== 'signin' || checkoutPlan) params.set('mode', next);
    if (checkoutPlan) params.set('plan', checkoutPlan);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `/login?${qs}` : '/login');
  }

  // Deep links from pricing/home fix the plan; otherwise signup offers a picker.
  const showPlanPicker = mode === 'signup' && !hasCheckoutPlan;
  const effectivePlan: 'pro' | 'pro-annual' | null = hasCheckoutPlan
    ? checkoutPlan
    : showPlanPicker && selectedPlan === 'pro'
      ? 'pro'
      : null;

  const signInRedirect = effectivePlan ? `/upgrade?plan=${effectivePlan}` : '/dashboard';

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.error ?? result.message ?? 'Password reset email sent.');
    } catch {
      setMessage('Something went wrong. Please try again.');
    }

    setLoading(false);
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setMessage('Enter your email address first.');
      return;
    }
    setLoading(true);
    const result = await resendSignupConfirmation(email);
    setMessage(result.error ?? result.message ?? 'Confirmation email sent.');
    setLoading(false);
  }

  return (
    <div className="auth-page min-h-screen">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="auth-brand-panel flex flex-1 flex-col justify-between px-8 py-10 sm:px-12 lg:max-w-[48%] lg:px-14 lg:py-14 xl:px-16">
          <div className="auth-brand-blob-a" />
          <div className="auth-brand-blob-b" />

          <div className="relative z-10 auth-form-enter">
            <UpperDeckLogo size="lg" theme="light" />
            <p className="auth-brand-tagline">{BRAND_TAGLINE}</p>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0 auth-form-enter">
            <h2 className="auth-hero-title">Built for businesses that need capacity now.</h2>
            <p className="auth-hero-body">{TAGLINE}</p>

            <div className="auth-trust-row mt-10">
              <div className="auth-trust-item">
                <span className="auth-trust-icon">
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                AI employees built for client delivery
              </div>
              <div className="auth-trust-item">
                <span className="auth-trust-icon">
                  <Users className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                Built for focus and collaboration
              </div>
              <div className="auth-trust-item">
                <span className="auth-trust-icon">
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                Secure by design · Enterprise ready
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 hidden lg:block">
            <p className="text-xs marketing-text-muted">
              Meet {AI_EMPLOYEE_NAME}, your AI employee inside UpperDeck.
            </p>
            <SunnyMascot className="mt-5" animate="float" />
          </div>
        </div>

        <div className="auth-visual-panel relative flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen">
          <div className="auth-visual-ribbon" />

          <div className="auth-visual-fan hidden xl:block" aria-hidden>
            <GlassStatCard label="Projects" value="24" sub="Active projects" dark className="auth-fan-card" />
            <GlassStatCard label="Decks" value="18" sub="Updated this week" className="auth-fan-card" />
            <GlassStatCard label="Signals" value="9" sub="Waiting on you" dark className="auth-fan-card" />
            <GlassStatCard label="Briefs" value="12" sub="Ready today" className="auth-fan-card" />
          </div>

          <div className="auth-form-enter relative z-10 w-full max-w-[400px]">
            <div className="auth-glass-form p-8 sm:p-9">
              <div className="mb-6 lg:hidden">
                <UpperDeckLogo size="md" theme="light" />
              </div>

              <ModeTabs mode={mode} onSwitchMode={switchMode} />

              <div key={mode} className="auth-mode-enter mt-7">
                <h1 className="auth-form-title">{copy.title}</h1>
                <p className="auth-form-subtitle">
                  {hasCheckoutPlan && mode === 'signup'
                    ? 'Create your account, then continue to secure checkout.'
                    : copy.subtitle}
                </p>
              </div>

              {showPlanPicker && <PlanPicker selected={selectedPlan} onSelect={setSelectedPlan} />}

              {hasCheckoutPlan && (
                <div className="auth-alert auth-alert-success mt-5">
                  You selected{' '}
                  <strong>{checkoutPlan === 'pro-annual' ? 'Pro Annual' : 'Pro'}</strong>. Sign in or
                  create an account to continue.
                </div>
              )}

              {authError && (
                <div className="auth-alert auth-alert-error mt-5">
                  Email confirmation failed or the link expired. Try signing in or request a new
                  confirmation email.
                </div>
              )}

              {(mode === 'signin' || mode === 'signup') && (
                <>
                  <GoogleAuthForm
                    redirect={signInRedirect}
                    checkoutPlan={effectivePlan}
                    onSubmit={() => setNavigating(true)}
                  />
                  <div className="auth-divider mt-5">or</div>
                </>
              )}

              {mode === 'signin' && (
                <form
                  action="/api/auth/sign-in"
                  method="POST"
                  className="mt-5 space-y-4"
                  onSubmit={() => setNavigating(true)}
                >
                  <input type="hidden" name="redirect" value={signInRedirect} />
                  {checkoutPlan && <input type="hidden" name="plan" value={checkoutPlan} />}
                  <FormField
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label htmlFor="password" className="auth-label mb-0">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="auth-link shrink-0 text-[13px]"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="auth-input"
                    />
                  </div>
                  {message && (
                    <AuthMessage
                      message={message}
                      mode={mode}
                      onSwitchMode={switchMode}
                      onResendConfirmation={handleResendConfirmation}
                    />
                  )}
                  <button type="submit" className="auth-submit group mt-2">
                    {copy.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </form>
              )}

              {mode === 'signup' && (
                <form
                  action="/api/auth/sign-up"
                  method="POST"
                  className="mt-5 space-y-4"
                  onSubmit={() => setNavigating(true)}
                >
                  {effectivePlan && <input type="hidden" name="plan" value={effectivePlan} />}
                  <FormField id="fullName" name="fullName" label="Full name" required autoComplete="name" placeholder="Your name" />
                  <FormField
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                  <FormField
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                  {message && <AuthMessage message={message} mode={mode} onSwitchMode={switchMode} />}
                  <button type="submit" className="auth-submit group mt-2">
                    {copy.cta}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                  <SignUpLegalNotice className="mt-4" />
                </form>
              )}

              {mode === 'forgot' && (
                <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                  <FormField
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                  {message && <AuthMessage message={message} mode={mode} onSwitchMode={switchMode} />}
                  <button type="submit" disabled={loading} className="auth-submit group mt-2">
                    {loading ? (
                      <>
                        <span className="auth-spinner h-4 w-4 rounded-full border-2 border-white/25 border-t-white" />
                        {copy.loading}
                      </>
                    ) : (
                      <>
                        {copy.cta}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {mode === 'forgot' && (
                <p className="mt-6 text-center text-[14px] marketing-text">
                  Remember your password?{' '}
                  <button type="button" onClick={() => switchMode('signin')} className="auth-link">
                    Back to sign in
                  </button>
                </p>
              )}

              {(mode === 'signin' || mode === 'signup') && (
                <p className="mt-6 text-center text-[13px] marketing-text-muted">
                  Need organization access?{' '}
                  <Link href="/request-quote" className="auth-link">
                    Request a quote
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {navigating && (
        <div className="auth-loading-overlay" role="status" aria-live="polite">
          <div className="auth-loading-card">
            <SunnyMascot animate="float" />
            <p className="auth-loading-title">
              {mode === 'signup' ? 'Creating your account' : 'Signing you in'}
            </p>
            <p className="auth-loading-sub">
              {mode === 'signup'
                ? 'Setting up your workspace…'
                : 'Getting your workspace ready…'}
            </p>
            <span className="auth-spinner auth-loading-spinner" aria-hidden />
          </div>
        </div>
      )}
    </div>
  );
}
