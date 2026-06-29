import { cn } from '@/lib/utils';

/** Remaining viewport height after project header, tabs, and padding (mobile includes app top bar). */
export const EMBEDDED_CHAT_MAX_HEIGHT =
  'max-h-[calc(100dvh-14.5rem)] lg:max-h-[calc(100dvh-11rem)]';

export function chatShellClassName(embedded?: boolean) {
  return cn(
    'relative flex w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]',
    embedded
      ? cn('flex-1 min-h-0', EMBEDDED_CHAT_MAX_HEIGHT, '-mx-4 sm:mx-0')
      : 'min-h-[360px] h-[calc(100dvh-3.5rem)]'
  );
}
