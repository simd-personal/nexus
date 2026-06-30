import { ImageResponse } from 'next/og';
import { AppIconImage } from '@/lib/brand/app-icon-image';

const ALLOWED_SIZES = new Set(['192', '512']);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> }
) {
  const { size } = await context.params;
  if (!ALLOWED_SIZES.has(size)) {
    return new Response('Not found', { status: 404 });
  }

  const px = Number(size);
  const markSize = Math.round(px * 0.58);

  return new ImageResponse(<AppIconImage markSize={markSize} />, {
    width: px,
    height: px,
  });
}
