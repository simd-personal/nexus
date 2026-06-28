/**
 * Canonical app URL for Supabase auth email links (signup confirm, password reset).
 * Prefer explicit env, then Vercel deployment host, then localhost for dev.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
}
