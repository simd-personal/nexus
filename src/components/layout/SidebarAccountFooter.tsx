'use client';

import { useEffect, useState } from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';

type AccountSummary = {
  displayName: string;
  subtitle: string;
};

function AccountAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700 dark:bg-[var(--ud-cloud)] dark:text-gray-100">
      {initial}
    </div>
  );
}

export function SidebarAccountFooter() {
  const [account, setAccount] = useState<AccountSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/account', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<AccountSummary>;
      })
      .then((data) => {
        if (!cancelled && data) setAccount(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = account?.displayName ?? 'Your account';
  const subtitle = account?.subtitle ?? 'Loading…';

  return (
    <div className="border-t border-gray-100 p-4 dark:border-[var(--ud-cloud)]">
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
