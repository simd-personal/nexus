import { useId } from 'react';
import { APP_DOMAIN } from '@/lib/constants';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoTheme = 'light' | 'dark' | 'glass';

const sizes: Record<LogoSize, { icon: number; word: string; tld: string; gap: string }> = {
  sm: { icon: 28, word: 'text-[15px]', tld: 'text-[13px]', gap: 'gap-2.5' },
  md: { icon: 34, word: 'text-lg', tld: 'text-base', gap: 'gap-3' },
  lg: { icon: 40, word: 'text-xl', tld: 'text-lg', gap: 'gap-3' },
  xl: { icon: 48, word: 'text-2xl', tld: 'text-xl', gap: 'gap-3.5' },
};

export function UpperDeckIcon({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const r = size * 0.19;
  const gap = size * 0.08;
  const start = (size - 2 * r - gap) / 2;

  const circles = [
    [start, start],
    [start + r + gap, start],
    [start, start + r + gap],
    [start + r + gap, start + r + gap],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#7EB6FF" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#A78BFA" stopOpacity="0.75" />
          <stop offset="1" stopColor="#C4B5FD" stopOpacity="0.55" />
        </linearGradient>
        <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" result="blur" />
        </filter>
      </defs>
      {circles.map(([cx, cy], i) => (
        <g key={i}>
          <circle
            cx={cx + r}
            cy={cy + r}
            r={r}
            fill={`url(#${uid}-g)`}
            fillOpacity={0.35 + i * 0.08}
          />
          <circle
            cx={cx + r}
            cy={cy + r}
            r={r}
            fill="white"
            fillOpacity={0.12}
            stroke="white"
            strokeOpacity={0.45}
            strokeWidth={0.75}
          />
        </g>
      ))}
    </svg>
  );
}

export function UpperDeckLogo({
  size = 'md',
  theme = 'light',
  showWordmark = true,
  showDomain = true,
  className,
}: {
  size?: LogoSize;
  theme?: LogoTheme;
  showWordmark?: boolean;
  showDomain?: boolean;
  className?: string;
}) {
  const s = sizes[size];
  const nameClass =
    theme === 'dark' || theme === 'glass'
      ? 'text-white'
      : 'text-[var(--ud-graphite)]';
  const tldClass =
    theme === 'dark' || theme === 'glass'
      ? 'text-white/55'
      : 'text-[var(--ud-slate)]';

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <UpperDeckIcon size={s.icon} />
      {showWordmark && (
        <span className={cn('font-display font-semibold tracking-[-0.03em]', s.word, nameClass)}>
          UpperDeck
          {showDomain && (
            <span className={cn('font-normal', s.tld, tldClass)}>.{APP_DOMAIN.split('.')[1]}</span>
          )}
        </span>
      )}
    </div>
  );
}
