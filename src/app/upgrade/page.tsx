import { Suspense } from 'react';
import { UpgradePageClient } from '@/components/billing/UpgradePageClient';

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
        </div>
      }
    >
      <UpgradePageClient />
    </Suspense>
  );
}
