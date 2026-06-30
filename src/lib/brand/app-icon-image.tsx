import { BRAND } from '@/lib/brand/colors';

type AppIconImageProps = {
  markSize?: number;
};

/** Shared mark used by favicon, apple-touch, and PWA manifest icons. */
export function AppIconImage({ markSize = 112 }: AppIconImageProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${BRAND.bgSecondary} 0%, ${BRAND.bgPrimary} 100%)`,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 35%, rgba(37,99,235,0.35) 0%, transparent 60%)',
        }}
      />
      <svg width={markSize} height={markSize} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="app-icon-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor={BRAND.accentLight} />
            <stop offset="50%" stopColor={BRAND.accent} />
            <stop offset="100%" stopColor={BRAND.accentDark} />
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="9"
          fill="url(#app-icon-g)"
          fillOpacity={0.55}
          stroke={BRAND.text}
          strokeOpacity={0.4}
          strokeWidth={0.75}
        />
        <circle
          cx="32"
          cy="16"
          r="9"
          fill="url(#app-icon-g)"
          fillOpacity={0.65}
          stroke={BRAND.text}
          strokeOpacity={0.4}
          strokeWidth={0.75}
        />
        <circle
          cx="16"
          cy="32"
          r="9"
          fill="url(#app-icon-g)"
          fillOpacity={0.75}
          stroke={BRAND.text}
          strokeOpacity={0.4}
          strokeWidth={0.75}
        />
        <circle
          cx="32"
          cy="32"
          r="9"
          fill="url(#app-icon-g)"
          fillOpacity={0.85}
          stroke={BRAND.text}
          strokeOpacity={0.4}
          strokeWidth={0.75}
        />
      </svg>
    </div>
  );
}
