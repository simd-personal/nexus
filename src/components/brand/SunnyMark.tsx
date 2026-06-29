import { cn } from '@/lib/utils';

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

type SunnyMarkProps = {
  size?: number;
  className?: string;
};

/** Crisp vector Sunny mark — flat amber sun, navy shades (option A). */
export function SunnyMark({ size = 24, className }: SunnyMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden
      className={cn('shrink-0', className)}
    >
      <g transform="translate(32,32)" fill="#FBBF24">
        {RAY_ANGLES.map((deg) => (
          <path
            key={deg}
            d="M0,-27 L-3.5,-14.5 L3.5,-14.5 Z"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="17" fill="#F59E0B" />
      <rect x="19" y="27" width="10" height="8" rx="2.5" fill="#1A2433" />
      <rect x="35" y="27" width="10" height="8" rx="2.5" fill="#1A2433" />
      <rect x="29" y="30" width="6" height="2" rx="1" fill="#1A2433" />
      <path
        d="M24 40 Q32 46 40 40"
        stroke="#1A2433"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
