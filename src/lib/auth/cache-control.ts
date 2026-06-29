import { NextResponse } from 'next/server';

/** Auth pages must never be CDN-cached — stale 304s break login behind corporate proxies (e.g. Zscaler). */
export const AUTH_PATH_PREFIXES = ['/login', '/auth'] as const;

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function applyNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  return response;
}

export function withNoStoreIfAuthPath(pathname: string, response: NextResponse): NextResponse {
  return isAuthPath(pathname) ? applyNoStoreHeaders(response) : response;
}
