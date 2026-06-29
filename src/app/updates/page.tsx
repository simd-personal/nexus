import { AppShell } from '@/components/layout/AppShell';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import { getSunnyUpdates } from '@/lib/data/queries';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function SunnyUpdatesPage() {
  const updates = await getSunnyUpdates();

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-8">
          <SunnyAvatar size="md" />
          <div>
            <h1 className="app-page-title text-2xl">{AI_EMPLOYEE_NAME} Updates</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              What changed, what matters, and what needs your attention
            </p>
          </div>
        </div>

        <SunnyUpdatesList updates={updates} />
      </div>
    </AppShell>
  );
}
