import { chatShellClassName } from '@/lib/chat/shell';

export function ChatLoadingShell({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={chatShellClassName(embedded)}>
      <div className="hidden w-56 shrink-0 animate-pulse space-y-2 border-r border-gray-200 bg-gray-50 p-3 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] sm:block">
        <div className="h-9 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        <div className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        <div className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        <div className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
      </div>
      <div className="flex min-h-0 flex-1 animate-pulse flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]">
          <div className="h-7 w-28 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
          <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          <div className="mx-auto h-4 w-1/3 rounded bg-gray-200 dark:bg-[var(--ud-cloud)]" />
          <div className="mx-auto h-4 w-1/2 rounded bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        </div>
        <div className="m-4 h-24 shrink-0 rounded-2xl border-t border-gray-200 bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]" />
      </div>
    </div>
  );
}
