'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/actions/auth';
import { APP_NAME } from '@/lib/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const result = await requestPasswordReset(email);
    if (result.error) {
      setMessage(result.error);
    } else {
      setIsSuccess(true);
      setMessage(result.message ?? 'Check your email for a reset link.');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to sign in
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-8">
          Enter the email for your {APP_NAME} account. We&apos;ll send a secure link to choose a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {message && (
            <p className={`text-sm ${isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
