import { isAuthPath } from '@/lib/auth/cache-control';

/** API routes that skip session middleware (multipart bodies). */
export function isMultipartApiRoute(pathname: string): boolean {
  return pathname === '/api/upload' || /^\/api\/files\/[^/]+\/replace$/.test(pathname);
}

/** API routes that do not require a logged-in Supabase user. */
export function isPublicApiRoute(pathname: string): boolean {
  if (pathname === '/api/health') return true;
  if (pathname === '/api/stripe/webhook') return true;
  if (pathname === '/api/inbound/email') return true;
  if (pathname.startsWith('/api/cron/')) return true;
  if (isAuthPath(pathname) || pathname.startsWith('/api/auth/')) return true;
  return false;
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}
