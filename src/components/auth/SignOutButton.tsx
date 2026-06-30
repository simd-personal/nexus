'use client';

import { LogOut } from 'lucide-react';
import { purgeAllChatCaches } from '@/lib/chat/cache';
import { cn } from '@/lib/utils';

type SignOutButtonProps = {
  variant?: 'sidebar' | 'settings' | 'icon';
  className?: string;
};

export function SignOutButton({ variant = 'sidebar', className }: SignOutButtonProps) {
  return (
    <form
      action="/api/auth/sign-out"
      method="post"
      className={variant === 'icon' ? undefined : 'w-full'}
      onSubmit={() => purgeAllChatCaches()}
    >
      <button
        type="submit"
        aria-label="Sign out"
        className={cn(
          variant === 'sidebar' &&
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[var(--ud-cloud)] dark:hover:text-gray-100',
          variant === 'settings' &&
            'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-cloud)] dark:text-gray-100 dark:hover:bg-[var(--ud-slate)]/30',
          variant === 'icon' &&
            'flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[var(--ud-cloud)]',
          className
        )}
      >
        <LogOut className={cn('shrink-0', variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4')} />
        {variant !== 'icon' && 'Sign out'}
      </button>
    </form>
  );
}
