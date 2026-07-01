'use client';

import { useEffect, useState } from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import type { AccountSummary } from '@/lib/account/summary';

function AccountAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-[var(--ud-cloud)] dark:text-gray-100">
      {initial}
    </div>
  );
}

export function SidebarAccountFooter({ account: initialAccount = null }: { account?: AccountSummary | null }) {
  const [account, setAccount] = useState<AccountSummary | null>(initialAccount);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>(() =>
    initialAccount ? 'idle' : 'loading'
  );

  useEffect(() => {
    setAccount(initialAccount);
    setLoadState(initialAccount ? 'idle' : 'loading');
  }, [initialAccount]);

  useEffect(() => {
    if (initialAccount) return;

    let cancelled = false;

    void fetch('/api/account', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<AccountSummary>;
      })
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setAccount(data);
          setLoadState('idle');
          return;
        }
        setLoadState('error');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [initialAccount]);

  const displayName = account?.displayName ?? 'Your account';
  const subtitle =
    account?.subtitle ??
    (loadState === 'error' ? 'Session unavailable' : 'Loading…');

  return (
    <div className="border-t border-[var(--app-border-faint)] p-4">
      <div className="mb-2 flex items-center gap-3 px-3 py-2">
        <AccountAvatar name={displayName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      <SignOutButton variant="sidebar" />
    </div>
  );
}
