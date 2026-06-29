import { APP_DOMAIN } from '@/lib/constants';

/**
 * Canonical app URL for Supabase auth email links (signup confirm, password reset)
 * and transactional email footers.
 *
 * Production always resolves to https://upperdeck.dev unless AUTH_SITE_URL is set.
 * Preview deployments keep *.vercel.app URLs for branch testing.
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

const CANONICAL_PRODUCTION_URL = `https://${APP_DOMAIN}`;

function isLocalhostHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `http://${url}`);
    return isLocalhostHost(parsed.hostname);
  } catch {
    return false;
  }
}

function isVercelAppHost(host: string): boolean {
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  return hostname.endsWith('.vercel.app');
}

function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

type SiteUrlOptions = {
  requestHost?: string | null;
  requestProto?: string | null;
};

export function getSiteUrl(options?: SiteUrlOptions): string {
  const authSiteUrl = process.env.AUTH_SITE_URL?.trim();
  if (authSiteUrl) {
    const withProtocol = authSiteUrl.startsWith('http')
      ? authSiteUrl
      : `https://${authSiteUrl}`;
    return normalizeUrl(withProtocol);
  }

  const requestHost = options?.requestHost?.trim();
  if (requestHost && !isLocalhostHost(requestHost)) {
    const proto = options?.requestProto?.trim() || 'https';
    if (isProductionDeploy() && isVercelAppHost(requestHost)) {
      return CANONICAL_PRODUCTION_URL;
    }
    return normalizeUrl(`${proto}://${requestHost}`);
  }

  if (isProductionDeploy()) {
    return CANONICAL_PRODUCTION_URL;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !isLocalhostUrl(configured)) {
    return normalizeUrl(configured);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    const withProtocol = productionUrl.startsWith('http')
      ? productionUrl
      : `https://${productionUrl}`;
    return normalizeUrl(withProtocol);
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return normalizeUrl(`https://${vercelHost}`);
  }

  if (configured) {
    return normalizeUrl(configured);
  }

  return 'http://localhost:3000';
}

/** Prefer the host the user actually hit (production domain from signup/login). */
export async function getSiteUrlFromHeaders(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  return getSiteUrl({
    requestHost: h.get('x-forwarded-host') ?? h.get('host'),
    requestProto: h.get('x-forwarded-proto'),
  });
}

/** Use callback request origin when the user landed on a real deployment host. */
export function getSiteUrlFromRequest(request: Request): string {
  const { origin, hostname } = new URL(request.url);
  if (!isLocalhostHost(hostname)) {
    if (isProductionDeploy() && isVercelAppHost(hostname)) {
      return CANONICAL_PRODUCTION_URL;
    }
    return origin;
  }
  return getSiteUrl();
}

/** Restrict post-auth redirects to same-origin relative paths. */
export function safeAuthNextPath(next: string | null | undefined): string {
  const path = (next ?? '/dashboard').trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return '/dashboard';
  }
  return path;
}

/** Supabase redirect allow-list matches path only; next is defaulted in /auth/callback. */
export function getAuthCallbackUrl(siteUrl = getSiteUrl()): string {
  return `${siteUrl}/auth/callback`;
}

export async function getAuthCallbackUrlFromHeaders(): Promise<string> {
  return getAuthCallbackUrl(await getSiteUrlFromHeaders());
}

export function isLocalhostSiteUrl(url = getSiteUrl()): boolean {
  return isLocalhostUrl(url);
}
