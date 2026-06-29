import type { NextRequest } from 'next/server';
import { isKnownVercelCronSchedule } from '@/lib/cron/schedules';

/**
 * Authorize Vercel cron invocations.
 * - Prefer Authorization: Bearer ${CRON_SECRET} when configured.
 * - Fall back to x-vercel-cron-schedule (Vercel sets this on every cron request).
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get('authorization');

  if (secret && auth === `Bearer ${secret}`) {
    return true;
  }

  const schedule = request.headers.get('x-vercel-cron-schedule');
  if (isKnownVercelCronSchedule(schedule)) {
    return true;
  }

  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  return false;
}
