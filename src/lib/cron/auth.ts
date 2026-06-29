import type { NextRequest } from 'next/server';

/** Vercel Cron sends Authorization: Bearer ${CRON_SECRET}. */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}
