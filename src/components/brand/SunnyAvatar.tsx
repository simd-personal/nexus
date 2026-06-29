import { AI_EMPLOYEE_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SunnyMark } from '@/components/brand/SunnyMark';

const SIZES = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
} as const;

export type SunnyAvatarSize = keyof typeof SIZES;

export type SunnyAnimate = 'none' | 'idle' | 'wave' | 'work';

const ANIMATE_CLASS: Record<SunnyAnimate, string> = {
  none: '',
  idle: 'sunny-animate-idle',
  wave: 'sunny-animate-wave',
  work: 'sunny-animate-work',
};

type SunnyAvatarProps = {
  size?: SunnyAvatarSize;
  className?: string;
  priority?: boolean;
  animate?: SunnyAnimate;
};

export function SunnyAvatar({
  size = 'md',
  className,
  animate = 'none',
}: SunnyAvatarProps) {
  const px = SIZES[size];

  return (
    <span
      role="img"
      aria-label={`${AI_EMPLOYEE_NAME} mascot`}
      className={cn('inline-flex shrink-0 leading-none', ANIMATE_CLASS[animate], className)}
    >
      <SunnyMark size={px} />
    </span>
  );
}

export type SunnyMascotAnimate = 'none' | 'float' | 'pop';

const MASCOT_ANIMATE_CLASS: Record<SunnyMascotAnimate, string> = {
  none: '',
  float: 'sunny-mascot-float',
  pop: 'sunny-mascot-pop',
};

type SunnyMascotProps = {
  className?: string;
  priority?: boolean;
  animate?: SunnyMascotAnimate;
};

/** Larger Sunny mark for marketing, auth, and onboarding hero moments. */
export function SunnyMascot({ className, animate = 'float' }: SunnyMascotProps) {
  return (
    <span
      role="img"
      aria-label={`${AI_EMPLOYEE_NAME}, your AI employee`}
      className={cn('inline-flex leading-none', MASCOT_ANIMATE_CLASS[animate], className)}
    >
      <SunnyMark size={180} />
    </span>
  );
}
