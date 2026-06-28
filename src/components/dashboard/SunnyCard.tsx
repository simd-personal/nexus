import Link from 'next/link';
import { Sun } from 'lucide-react';
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
    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Sun className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {AI_EMPLOYEE_NAME} has reviewed your active projects
          </h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Metric label="Critical items" value={criticalCount} highlight={criticalCount > 0} />
            <Metric label="New updates" value={newUpdatesCount} />
            <Metric label="Open actions" value={actionItemsCount} />
            <Metric label="Possible conflicts" value={conflictsCount} highlight={conflictsCount > 0} />
          </div>
          <Link href="/updates" className="mt-4 inline-block">
            <Button size="sm">View Sunny Updates</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
