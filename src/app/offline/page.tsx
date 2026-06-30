import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--ud-stone)] px-6 py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--brand-accent)]">{APP_NAME}</p>
      <h1 className="app-page-title mt-3 text-2xl">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Reconnect to load your dashboard, chat with Sunny, and sync project updates.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button>Try again</Button>
        </Link>
      </div>
    </main>
  );
}
