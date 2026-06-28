export function ChatLoadingShell() {
  return (
    <div className="flex h-[calc(100vh-4rem)] animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-mist)]">
      <div className="hidden w-56 space-y-2 border-r border-gray-200 bg-gray-50 p-3 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)] sm:block">
        <div className="h-9 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        <div className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        <div className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        <div className="h-8 rounded-lg bg-gray-200 dark:bg-[var(--ud-cloud)]" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="h-12 border-b border-gray-100 bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]" />
        <div className="flex-1 space-y-4 p-6">
          <div className="mx-auto h-4 w-1/3 rounded bg-gray-200 dark:bg-[var(--ud-cloud)]" />
          <div className="mx-auto h-4 w-1/2 rounded bg-gray-200 dark:bg-[var(--ud-cloud)]" />
        </div>
        <div className="m-4 h-24 rounded-2xl border-t border-gray-200 bg-gray-50 dark:border-[var(--ud-cloud)] dark:bg-[var(--ud-stone)]" />
      </div>
    </div>
  );
}
