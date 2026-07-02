'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updatePassword } from '@/lib/actions/auth';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    function checkProviders(user: { app_metadata?: { providers?: string[] } } | null | undefined) {
      const providers = user?.app_metadata?.providers ?? [];
      setGoogleOnly(providers.includes('google') && !providers.includes('email'));
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
        checkProviders(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        checkProviders(session?.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await updatePassword(password);
    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          ← Back to sign in
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">Choose a new password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Set a new password for your account. You&apos;ll stay signed in after saving.
        </p>

        {!ready ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Verifying your reset link…</p>
        ) : done ? (
          <p className="text-sm text-emerald-600">Password updated. Redirecting…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {googleOnly && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                You currently sign in with Google. Setting a password also enables email
                sign-in — you can keep using Google either way.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                required
                minLength={8}
              />
            </div>

            {message && <p className="text-sm text-red-600">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
