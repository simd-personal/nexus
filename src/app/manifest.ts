import type { MetadataRoute } from 'next';
import { APP_NAME, META_DESCRIPTION } from '@/lib/constants';
import { BRAND } from '@/lib/brand/colors';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: APP_NAME,
    short_name: APP_NAME,
    description: META_DESCRIPTION,
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: BRAND.bgPrimary,
    theme_color: BRAND.accent,
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
