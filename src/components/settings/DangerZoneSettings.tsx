'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function DangerZoneSettings({
  isEnterprise,
  hasActiveSubscription,
}: {
  isEnterprise: boolean;
  hasActiveSubscription: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isEnterprise) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Enterprise accounts are managed by our team. Contact support to close your
        organization account.
      </p>
    );
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Could not delete your account. Try again.');
        setLoading(false);
        return;
      }

      window.location.href = `/login?message=${encodeURIComponent(
        'Your account and all its data have been permanently deleted.'
      )}`;
    } catch {
      setError('Could not delete your account. Check your connection and try again.');
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Permanently delete your account, projects, files, and chat history.
          {hasActiveSubscription && ' Your subscription will be canceled immediately without a refund.'}{' '}
          This cannot be undone.
        </p>
        <Button type="button" size="sm" variant="danger" onClick={() => setConfirming(true)}>
          Delete account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleDelete} className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-medium">This permanently deletes:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>All projects, uploaded files, and generated documents</li>
          <li>All Sunny chat history and briefings</li>
          {hasActiveSubscription && (
            <li>Your subscription — canceled immediately, no refund for the current period</li>
          )}
          <li>Your sign-in credentials and profile</li>
        </ul>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] dark:text-gray-100"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          variant="danger"
          disabled={confirmText !== 'DELETE' || loading}
          loading={loading}
        >
          {loading ? 'Deleting…' : 'Permanently delete account'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => {
            setConfirming(false);
            setConfirmText('');
            setError('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
