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
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]',
          variant === 'settings' &&
            'inline-flex items-center gap-2 rounded-lg border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] px-4 py-2 text-sm font-medium text-[var(--btn-secondary-text)] transition-colors hover:bg-[var(--btn-secondary-bg-hover)]',
          variant === 'icon' &&
            'flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]',
          className
        )}
      >
        <LogOut className={cn('shrink-0', variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4')} />
        {variant !== 'icon' && 'Sign out'}
      </button>
    </form>
  );
}
