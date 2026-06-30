import { ImageResponse } from 'next/og';
import { AppIconImage } from '@/lib/brand/app-icon-image';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(<AppIconImage markSize={20} />, { ...size });
}
