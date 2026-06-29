import { ImageResponse } from 'next/og';

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
          background: 'linear-gradient(135deg, #5b9cf6 0%, #7c6cf0 52%, #9333ea 100%)',
        }}
      >
        <svg width="112" height="112" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="apple-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop stopColor="#ffffff" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="9" fill="url(#apple-g)" fillOpacity={0.55} stroke="white" strokeOpacity={0.65} strokeWidth={0.75} />
          <circle cx="32" cy="16" r="9" fill="url(#apple-g)" fillOpacity={0.65} stroke="white" strokeOpacity={0.65} strokeWidth={0.75} />
          <circle cx="16" cy="32" r="9" fill="url(#apple-g)" fillOpacity={0.75} stroke="white" strokeOpacity={0.65} strokeWidth={0.75} />
          <circle cx="32" cy="32" r="9" fill="url(#apple-g)" fillOpacity={0.85} stroke="white" strokeOpacity={0.65} strokeWidth={0.75} />
        </svg>
      </div>
    ),
    { ...size }
  );
}
