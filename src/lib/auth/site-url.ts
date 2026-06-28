/**
 * Canonical app URL for Supabase auth email links (signup confirm, password reset).
 *
 * On Vercel, runtime env (VERCEL_*) wins over NEXT_PUBLIC_SITE_URL so a localhost
 * value baked in at build time cannot leak into production confirmation emails.
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/$/, '');
}

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
    return normalizeUrl(`${proto}://${requestHost}`);
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

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
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
