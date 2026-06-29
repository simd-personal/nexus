import Image from 'next/image';
import { AI_EMPLOYEE_NAME, SUNNY_AVATAR_SRC, SUNNY_MASCOT_SRC } from '@/lib/constants';
import { cn } from '@/lib/utils';

const SIZES = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
} as const;

export type SunnyAvatarSize = keyof typeof SIZES;

type SunnyAvatarProps = {
  size?: SunnyAvatarSize;
  className?: string;
  priority?: boolean;
};

export function SunnyAvatar({ size = 'md', className, priority }: SunnyAvatarProps) {
  const px = SIZES[size];

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-amber-200/80 dark:bg-[var(--ud-mist)] dark:ring-amber-700/40',
        className
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={SUNNY_AVATAR_SRC}
        alt={`${AI_EMPLOYEE_NAME} mascot`}
        width={px}
        height={px}
        priority={priority}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

type SunnyMascotProps = {
  className?: string;
  priority?: boolean;
};

/** Larger Sunny icon for marketing, auth, and onboarding hero moments. */
export function SunnyMascot({ className, priority }: SunnyMascotProps) {
  return (
    <Image
      src={SUNNY_MASCOT_SRC}
      alt={`${AI_EMPLOYEE_NAME}, your AI employee`}
      width={512}
      height={512}
      priority={priority}
      className={cn('h-auto w-full max-w-[200px] object-contain', className)}
    />
  );
}
