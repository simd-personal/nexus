import Image from 'next/image';
import { AI_EMPLOYEE_NAME, SUNNY_AVATAR_SRC, SUNNY_POSES_SRC } from '@/lib/constants';
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
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-50 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:ring-amber-800/50',
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
        className="h-full w-full object-cover object-[center_12%]"
      />
    </span>
  );
}

type SunnyMascotProps = {
  className?: string;
  priority?: boolean;
};

/** Larger pose sheet for marketing, auth, and onboarding hero moments. */
export function SunnyMascot({ className, priority }: SunnyMascotProps) {
  return (
    <Image
      src={SUNNY_POSES_SRC}
      alt={`${AI_EMPLOYEE_NAME}, your AI employee`}
      width={900}
      height={338}
      priority={priority}
      className={cn('h-auto w-full max-w-xl object-contain', className)}
    />
  );
}
