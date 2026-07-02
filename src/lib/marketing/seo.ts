import type { Metadata } from 'next';
import { isAuthPath } from '@/lib/auth/cache-control';
import { APP_DOMAIN, APP_NAME, BRAND_TAGLINE } from '@/lib/constants';

export const DEFAULT_OG_IMAGE_PATH = '/opengraph-image';
export const OG_IMAGE_ALT = `${APP_NAME} — ${BRAND_TAGLINE}`;

export const MARKETING_PATHS = [
  '/',
  '/product',
  '/pricing',
  '/integrations',
  '/for-consultants',
  '/for-freelancers',
  '/for-agencies',
  '/client-intelligence',
  '/about',
  '/privacy',
  '/terms',
  '/request-quote',
] as const;

export { isAuthPath };

export function isPublicUnauthenticatedPath(pathname: string): boolean {
  if (pathname === '/offline') return true;
  if (/^\/icons\/(192|512)$/.test(pathname)) return true;
  return isPublicMarketingPath(pathname) || isAuthPath(pathname);
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
  }
  return `https://${APP_DOMAIN}`;
}

export function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return MARKETING_PATHS.some(
    (path) => path !== '/' && (pathname === path || pathname.startsWith(`${path}/`))
  );
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function createMarketingMetadata({
  title,
  description,
  path,
  keywords,
}: PageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}${path}`;
  const pageTitle = path === '/' ? `${APP_NAME} | ${BRAND_TAGLINE}` : title;
  const socialTitle = path === '/' ? pageTitle : `${title} | ${APP_NAME}`;
  const socialImage = {
    url: DEFAULT_OG_IMAGE_PATH,
    width: 1200,
    height: 630,
    alt: OG_IMAGE_ALT,
  };

  return {
    title: pageTitle,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical,
      siteName: APP_NAME,
      title: socialTitle,
      description,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
