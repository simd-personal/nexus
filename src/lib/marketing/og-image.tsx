import { ImageResponse } from 'next/og';
import { APP_DOMAIN, APP_NAME, BRAND_TAGLINE } from '@/lib/constants';
import { OG_IMAGE_ALT } from '@/lib/marketing/seo';

export { OG_IMAGE_ALT };
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

async function loadSpaceGrotesk(weight: 500 | 600 | 700) {
  const url = `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@${weight}&display=swap`;
  const css = await fetch(url).then((res) => res.text());
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff2)'\)/);
  if (!match) throw new Error(`Failed to load Space Grotesk ${weight}`);
  return fetch(match[1]).then((res) => res.arrayBuffer());
}

function UpperDeckMark({ size }: { size: number }) {
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="og-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop stopColor="#7EB6FF" stopOpacity={0.9} />
          <stop offset="50%" stopColor="#A78BFA" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#C4B5FD" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      {circles.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx + r}
          cy={cy + r}
          r={r}
          fill="url(#og-g)"
          fillOpacity={0.35 + i * 0.08}
          stroke="white"
          strokeOpacity={0.45}
          strokeWidth={0.75}
        />
      ))}
    </svg>
  );
}

type OgImageOptions = {
  width?: number;
  height?: number;
  compact?: boolean;
};

export async function renderOgImage({
  width = OG_IMAGE_SIZE.width,
  height = OG_IMAGE_SIZE.height,
  compact = false,
}: OgImageOptions = {}) {
  const [fontMedium, fontSemibold, fontBold] = await Promise.all([
    loadSpaceGrotesk(500),
    loadSpaceGrotesk(600),
    loadSpaceGrotesk(700),
  ]);

  const iconSize = compact ? 96 : 120;
  const titleSize = compact ? 52 : 72;
  const taglineSize = compact ? 24 : 32;
  const domainSize = compact ? 22 : 28;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: compact ? '48px' : '72px',
          background: '#0e1115',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(91,156,246,0.35) 0%, rgba(91,156,246,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -100,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(147,51,234,0.28) 0%, rgba(147,51,234,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(91,156,246,0.08) 0%, rgba(124,108,240,0.06) 52%, rgba(147,51,234,0.08) 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 24 : 32,
            position: 'relative',
          }}
        >
          <UpperDeckMark size={iconSize} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: titleSize,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                }}
              >
                {APP_NAME}
              </span>
              <span
                style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: titleSize * 0.72,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '-0.03em',
                }}
              >
                .{APP_DOMAIN.split('.')[1]}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'Space Grotesk',
                fontSize: taglineSize,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.82)',
                letterSpacing: '-0.02em',
                maxWidth: compact ? 520 : 760,
                lineHeight: 1.25,
              }}
            >
              {BRAND_TAGLINE}
            </span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: compact ? 36 : 48,
            right: compact ? 48 : 72,
            fontFamily: 'Space Grotesk',
            fontSize: domainSize,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '-0.02em',
          }}
        >
          {APP_DOMAIN}
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: 'Space Grotesk', data: fontMedium, weight: 500, style: 'normal' },
        { name: 'Space Grotesk', data: fontSemibold, weight: 600, style: 'normal' },
        { name: 'Space Grotesk', data: fontBold, weight: 700, style: 'normal' },
      ],
    }
  );
}
