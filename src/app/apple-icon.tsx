import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/brand/colors';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
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
            background: `radial-gradient(circle at 50% 35%, rgba(37,99,235,0.35) 0%, transparent 60%)`,
          }}
        />
        <svg width="112" height="112" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="apple-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop stopColor={BRAND.accentLight} />
              <stop offset="50%" stopColor={BRAND.accent} />
              <stop offset="100%" stopColor={BRAND.accentDark} />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="9" fill="url(#apple-g)" fillOpacity={0.55} stroke={BRAND.text} strokeOpacity={0.4} strokeWidth={0.75} />
          <circle cx="32" cy="16" r="9" fill="url(#apple-g)" fillOpacity={0.65} stroke={BRAND.text} strokeOpacity={0.4} strokeWidth={0.75} />
          <circle cx="16" cy="32" r="9" fill="url(#apple-g)" fillOpacity={0.75} stroke={BRAND.text} strokeOpacity={0.4} strokeWidth={0.75} />
          <circle cx="32" cy="32" r="9" fill="url(#apple-g)" fillOpacity={0.85} stroke={BRAND.text} strokeOpacity={0.4} strokeWidth={0.75} />
        </svg>
      </div>
    ),
    { ...size }
  );
}
