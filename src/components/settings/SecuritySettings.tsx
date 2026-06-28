'use client';

import { useState } from 'react';
import { updatePassword } from '@/lib/actions/auth';
import { Button } from '@/components/ui/Button';

export function SecuritySettings() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');
    const result = await updatePassword(password);
    setMessage(result.error ?? 'Password updated successfully.');
    if (!result.error) {
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          minLength={8}
          required
        />
      </div>
      {message && (
        <p className={`text-sm ${message.includes('updated') ? 'text-emerald-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Saving…' : 'Update password'}
      </Button>
    </form>
  );
}
