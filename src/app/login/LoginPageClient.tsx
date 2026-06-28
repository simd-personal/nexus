'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { resendSignupConfirmation } from '@/lib/actions/auth';
import { APP_NAME, TAGLINE, AI_EMPLOYEE_NAME } from '@/lib/constants';
import { Sun } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const authError = searchParams.get('error') === 'auth';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      if (mode === 'forgot') {
        const siteUrl = window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${siteUrl}/auth/reset-password`,
        });
        setMessage(
          error
            ? error.message
            : 'If an account exists for that email, a password reset link has been sent.'
        );
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              account_type: 'individual',
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          setMessage(error.message);
        } else if (data.session) {
          window.location.href = '/dashboard';
        } else {
          setMessage(
            'Account created. Check your email to confirm your address, then sign in. You can reset your password anytime from the sign-in screen.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          window.location.href = '/dashboard';
        }
      }
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
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold">BN</span>
            </div>
            <h1 className="text-xl font-semibold">{APP_NAME}</h1>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Your AI command center for client performance
          </h2>
          <p className="text-gray-400 text-lg">{TAGLINE}</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Personal accounts</p>
            <p className="text-sm text-gray-400 mt-1">
              Free signup, email confirmation, and password recovery — like ChatGPT.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white">Organization accounts</p>
            <p className="text-sm text-gray-400 mt-1">
              Multi-tenant admin controls and healthcare PHI safeguards — request a quote, not free self-serve signup.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
            <Sun className="w-8 h-8 text-amber-400" />
            <div>
              <p className="font-medium">Meet {AI_EMPLOYEE_NAME}</p>
              <p className="text-sm text-gray-400">
                Your AI employee who has read every meeting, email, deck, and note.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white text-sm font-bold">BN</span>
            </div>
            <h1 className="text-lg font-semibold">{APP_NAME}</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'signup'
              ? 'Create your free account'
              : mode === 'forgot'
                ? 'Reset your password'
                : 'Welcome back'}
          </h2>
          <p className="text-gray-500 mb-8">
            {mode === 'signup'
              ? 'Start free with email confirmation and password recovery built in.'
              : mode === 'forgot'
                ? 'We will email you a secure link to choose a new password.'
                : 'Sign in to your command center'}
          </p>

          {authError && (
            <p className="mb-4 text-sm text-red-600">
              Email confirmation failed or the link expired. Try signing in or request a new confirmation email.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setMessage('');
                      }}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                  minLength={8}
                />
              </div>
            )}

            {message && (
              <div className="space-y-2">
                <p
                  className={`text-sm ${
                    message.includes('Check your email') ||
                    message.includes('reset link') ||
                    message.includes('Confirmation email')
                      ? 'text-emerald-600'
                      : 'text-red-600'
                  }`}
                >
                  {message}
                </p>
                {mode === 'signin' && message.toLowerCase().includes('confirm') && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    className="text-xs font-medium text-gray-700 underline"
                  >
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                  ? 'Create free account'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            {mode === 'signin' && (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setMessage('');
                  }}
                  className="text-gray-900 font-medium hover:underline"
                >
                  Sign up free
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setMessage('');
                  }}
                  className="text-gray-900 font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remember your password?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setMessage('');
                  }}
                  className="text-gray-900 font-medium hover:underline"
                >
                  Back to sign in
                </button>
              </>
            )}
          </p>

          {(mode === 'signin' || mode === 'signup') && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              Need an organization tenant with admin controls?{' '}
              <Link href="/request-quote" className="text-gray-600 underline">
                Request a quote
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
