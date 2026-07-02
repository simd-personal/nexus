import type { MetadataRoute } from 'next';
import { getSiteUrl, MARKETING_PATHS } from '@/lib/marketing/seo';

const PRIORITIES: Record<string, number> = {
  '/': 1,
  '/product': 0.9,
  '/pricing': 0.9,
  '/client-intelligence': 0.85,
  '/for-consultants': 0.8,
  '/for-freelancers': 0.8,
  '/for-agencies': 0.8,
  '/integrations': 0.75,
  '/request-quote': 0.7,
  '/about': 0.5,
  '/privacy': 0.3,
  '/terms': 0.3,
  '/data-policy': 0.3,
  '/acceptable-use': 0.3,
  '/refund-policy': 0.3,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return MARKETING_PATHS.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === '/' || path === '/pricing' ? 'weekly' : 'monthly',
    priority: PRIORITIES[path] ?? 0.5,
  }));
}
