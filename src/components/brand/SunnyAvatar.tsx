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
  priority,
  animate = 'none',
}: SunnyAvatarProps) {
  const px = SIZES[size];
  const retina = px * 2;

  return (
    <Image
      src={SUNNY_AVATAR_SRC}
      alt={`${AI_EMPLOYEE_NAME} mascot`}
      width={retina}
      height={retina}
      priority={priority}
      sizes={`${px}px`}
      className={cn(
        'inline-block shrink-0 object-contain sunny-avatar-img',
        ANIMATE_CLASS[animate],
        className
      )}
      style={{ width: px, height: px }}
    />
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

/** Larger Sunny icon for marketing, auth, and onboarding hero moments. */
export function SunnyMascot({
  className,
  priority,
  animate = 'float',
}: SunnyMascotProps) {
  return (
    <Image
      src={SUNNY_MASCOT_SRC}
      alt={`${AI_EMPLOYEE_NAME}, your AI employee`}
      width={400}
      height={400}
      priority={priority}
      sizes="200px"
      className={cn(
        'h-auto w-full max-w-[200px] object-contain sunny-avatar-img',
        MASCOT_ANIMATE_CLASS[animate],
        className
      )}
    />
  );
}
