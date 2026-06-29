'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resendSignupConfirmation, requestPasswordReset } from '@/lib/actions/auth';
import { BRAND_TAGLINE, TAGLINE, AI_EMPLOYEE_NAME } from '@/lib/constants';
import { loginHref, type LoginMode } from '@/lib/auth/login-url';
import { UpperDeckLogo } from '@/components/brand/UpperDeckLogo';
import { SunnyMascot } from '@/components/brand/SunnyAvatar';
import { SignUpLegalNotice } from '@/components/marketing/LegalPolicyLinks';
import { ArrowRight, Check, Lock, Users } from 'lucide-react';

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
        className="auth-input"
      />
    </div>
  );
}

function ModeTabs({
  mode,
  checkoutPlan,
}: {
  mode: AuthMode;
  checkoutPlan: 'pro' | 'pro-annual' | null;
}) {
  if (mode === 'forgot') return null;

  const plan = checkoutPlan ?? undefined;

  return (
    <div className="auth-mode-tabs" role="tablist" aria-label="Authentication mode">
      <Link
        href={loginHref({ mode: 'signin', plan })}
        role="tab"
        aria-selected={mode === 'signin'}
        className={mode === 'signin' ? 'auth-mode-tab auth-mode-tab-active' : 'auth-mode-tab'}
      >
        Sign in
      </Link>
      <Link
        href={loginHref({ mode: 'signup', plan })}
        role="tab"
        aria-selected={mode === 'signup'}
        className={mode === 'signup' ? 'auth-mode-tab auth-mode-tab-active' : 'auth-mode-tab'}
      >
        Sign up
      </Link>
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
  checkoutPlan,
  onResendConfirmation,
}: {
  message: string;
  mode: AuthMode;
  checkoutPlan: 'pro' | 'pro-annual' | null;
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
        <Link href={loginHref({ mode: 'signin', plan: checkoutPlan })} className="auth-link mt-2">
          Go to sign in
        </Link>
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
  mode,
  authError = false,
  checkoutPlan = null,
  initialMessage,
}: {
  mode: AuthMode;
  authError?: boolean;
  checkoutPlan?: 'pro' | 'pro-annual' | null;
  initialMessage?: string;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage ?? '');
  const hasCheckoutPlan = checkoutPlan === 'pro' || checkoutPlan === 'pro-annual';
  const copy = MODE_COPY[mode];

  const signInRedirect = hasCheckoutPlan ? `/upgrade?plan=${checkoutPlan}` : '/dashboard';

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
            <SunnyMascot className="mt-4 max-w-xs opacity-95" priority />
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

              <ModeTabs mode={mode} checkoutPlan={checkoutPlan} />

              <div key={mode} className="auth-mode-enter mt-7">
                <h1 className="auth-form-title">{copy.title}</h1>
                <p className="auth-form-subtitle">
                  {hasCheckoutPlan && mode === 'signup'
                    ? 'Create your account, then continue to secure checkout.'
                    : copy.subtitle}
                </p>
              </div>

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

              {mode === 'signin' && (
                <form action="/api/auth/sign-in" method="POST" className="mt-6 space-y-4">
                  <input type="hidden" name="redirect" value={signInRedirect} />
                  {checkoutPlan && <input type="hidden" name="plan" value={checkoutPlan} />}
                  <FormField
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="password" className="auth-label mb-0">
                        Password
                      </label>
                      <Link
                        href={loginHref({ mode: 'forgot', plan: checkoutPlan })}
                        className="auth-link text-[13px]"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="current-password"
                      className="auth-input"
                    />
                  </div>
                  {message && (
                    <AuthMessage
                      message={message}
                      mode={mode}
                      checkoutPlan={checkoutPlan}
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
                <form action="/api/auth/sign-up" method="POST" className="mt-6 space-y-4">
                  {checkoutPlan && <input type="hidden" name="plan" value={checkoutPlan} />}
                  <FormField id="fullName" name="fullName" label="Full name" required autoComplete="name" />
                  <FormField
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                  <FormField
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {message && <AuthMessage message={message} mode={mode} checkoutPlan={checkoutPlan} />}
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
                  />
                  {message && <AuthMessage message={message} mode={mode} checkoutPlan={checkoutPlan} />}
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
                  <Link href={loginHref({ mode: 'signin', plan: checkoutPlan })} className="auth-link">
                    Back to sign in
                  </Link>
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
    </div>
  );
}
