import Link from 'next/link';
import { SunnyAvatar } from '@/components/brand/SunnyAvatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AI_EMPLOYEE_NAME } from '@/lib/constants';

interface SunnyCardProps {
  criticalCount: number;
  newUpdatesCount: number;
  actionItemsCount: number;
  conflictsCount: number;
}

export function SunnyCard({ criticalCount, newUpdatesCount, actionItemsCount, conflictsCount }: SunnyCardProps) {
  return (
    <Card className="border-[rgba(124,108,240,0.22)] bg-gradient-to-br from-amber-50 via-white to-[#f3f0ff] dark:border-[rgba(167,139,250,0.35)] dark:from-amber-950/40 dark:via-[var(--ud-mist)] dark:to-indigo-950/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          <SunnyAvatar size="lg" animate="idle" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {AI_EMPLOYEE_NAME} has reviewed your active projects
          </h3>
          <div className="mt-4 grid w-full grid-cols-2 gap-4">
            <Metric label="Critical items" value={criticalCount} highlight={criticalCount > 0} />
            <Metric label="New updates" value={newUpdatesCount} />
            <Metric label="Open actions" value={actionItemsCount} />
            <Metric label="Possible conflicts" value={conflictsCount} highlight={conflictsCount > 0} />
          </div>
          <Link href="/updates" className="mt-4 inline-block">
            <Button size="sm" className="w-full sm:w-auto">View Sunny Updates</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      <p className="text-xs leading-snug text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
