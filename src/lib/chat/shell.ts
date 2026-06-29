import { cn } from '@/lib/utils';

export function chatShellClassName(embedded?: boolean) {
  return cn(
    'relative flex w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]',
    embedded ? 'min-h-[360px] flex-1 -mx-4 sm:mx-0' : 'min-h-[360px] h-[calc(100dvh-3.5rem)]'
  );
}
