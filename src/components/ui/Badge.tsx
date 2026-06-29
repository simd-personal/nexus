import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-700 dark:bg-[var(--ud-cloud)] dark:text-gray-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800',
  neutral: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200 dark:bg-[var(--ud-stone)] dark:text-gray-300 dark:ring-[var(--ud-cloud)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    healthy: { label: 'Healthy', variant: 'success' },
    watch: { label: 'Watch', variant: 'warning' },
    critical: { label: 'Critical', variant: 'danger' },
    needs_review: { label: 'Needs Review', variant: 'info' },
    open: { label: 'Open', variant: 'danger' },
    acknowledged: { label: 'Acknowledged', variant: 'warning' },
    resolved: { label: 'Resolved', variant: 'success' },
    low: { label: 'Low', variant: 'neutral' },
    medium: { label: 'Medium', variant: 'warning' },
    high: { label: 'High', variant: 'danger' },
  };

  const config = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{label ?? config.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: string }) {
  return <StatusBadge status={severity} />;
}

export function CategoryBadge({ category }: { category: string }) {
  const label = category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  return <Badge variant="info">{label}</Badge>;
}
