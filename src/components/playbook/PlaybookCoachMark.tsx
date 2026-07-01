import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_CLASS = {
  sm: { box: 'h-8 w-8 rounded-xl', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10 rounded-2xl', icon: 'h-5 w-5' },
  xl: { box: 'h-16 w-16 rounded-[1.25rem]', icon: 'h-8 w-8' },
} as const;

export function PlaybookCoachMark({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const sizing = SIZE_CLASS[size];

  return (
    <div
      className={cn(
        'playbook-coach-mark flex shrink-0 items-center justify-center',
        sizing.box,
        className
      )}
      aria-hidden
    >
      <ClipboardList className={sizing.icon} strokeWidth={1.75} />
    </div>
  );
}
