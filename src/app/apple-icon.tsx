import { ImageResponse } from 'next/og';
import { AppIconImage } from '@/lib/brand/app-icon-image';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(<AppIconImage markSize={112} />, { ...size });
}
