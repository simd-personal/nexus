import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/marketing/seo';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/projects', '/settings', '/api/', '/upgrade'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
