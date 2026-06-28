import { AppShell } from '@/components/layout/AppShell';
import { SunnyUpdatesList } from '@/components/updates/SunnyUpdateCard';
import { getSunnyUpdates } from '@/lib/data/queries';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { Sun } from 'lucide-react';

export default async function SunnyUpdatesPage() {
  const updates = await getSunnyUpdates();

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Sun className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{AI_EMPLOYEE_NAME} Updates</h1>
            <p className="text-sm text-gray-500">
              What changed, what matters, and what needs your attention
            </p>
          </div>
        </div>

        <SunnyUpdatesList updates={updates} />
      </div>
    </AppShell>
  );
}
