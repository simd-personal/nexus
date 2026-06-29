import { FileText, Search } from 'lucide-react';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';

interface EmptyStateProps {
  icon?: 'file' | 'search';
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'file', title, description, action }: EmptyStateProps) {
  const Icon = icon === 'search' ? Search : FileText;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-[var(--ud-cloud)]">
        <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action}
    </div>
  );
}

export function LoadingState({
  message = 'Loading...',
  sunny = false,
}: {
  message?: string;
  sunny?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {sunny ? (
        <div className="mb-4">
          <SunnyAvatar size="xl" animate="work" />
        </div>
      ) : (
        <svg className="mb-4 h-8 w-8 animate-spin text-gray-400 dark:text-gray-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
        <span className="text-xl text-red-500">!</span>
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">Something went wrong</h3>
      <p className="mb-4 max-w-md text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {retry && (
        <button onClick={retry} className="text-sm text-gray-700 underline hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
          Try again
        </button>
      )}
    </div>
  );
}
