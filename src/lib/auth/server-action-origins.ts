import { APP_DOMAIN } from '../constants';

function addHost(origins: Set<string>, raw: string | undefined) {
  const value = raw?.trim();
  if (!value) return;

  try {
    const host = value.includes('://') ? new URL(value).host : value.replace(/\/$/, '');
    if (host) origins.add(host);
  } catch {
    origins.add(value.replace(/^https?:\/\//, '').replace(/\/$/, ''));
  }
}

/** Hostnames permitted for Server Actions when Origin and Host differ (proxies, Vercel). */
export function serverActionAllowedOrigins(): string[] {
  const origins = new Set<string>([
    APP_DOMAIN,
    `www.${APP_DOMAIN}`,
    `*.${APP_DOMAIN}`,
    'localhost:3000',
    '127.0.0.1:3000',
    '*.vercel.app',
  ]);

  addHost(origins, process.env.VERCEL_URL);
  addHost(origins, process.env.VERCEL_BRANCH_URL);
  addHost(origins, process.env.VERCEL_PROJECT_PRODUCTION_URL);
  addHost(origins, process.env.AUTH_SITE_URL);
  addHost(origins, process.env.NEXT_PUBLIC_SITE_URL);

  const extra = process.env.SERVER_ACTION_ALLOWED_ORIGINS?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (extra) {
    for (const host of extra) origins.add(host);
  }

  return [...origins];
}
