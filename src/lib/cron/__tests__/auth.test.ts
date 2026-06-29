import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';

function cronRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/cron/sweep-files', { headers });
}

describe('isAuthorizedCronRequest', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts Bearer CRON_SECRET', () => {
    expect(
      isAuthorizedCronRequest(
        cronRequest({ authorization: 'Bearer test-cron-secret' })
      )
    ).toBe(true);
  });

  it('accepts x-vercel-cron-schedule from Vercel cron', () => {
    expect(
      isAuthorizedCronRequest(
        cronRequest({ 'x-vercel-cron-schedule': '*/5 * * * *' })
      )
    ).toBe(true);
  });

  it('rejects unknown schedules in production', () => {
    expect(
      isAuthorizedCronRequest(
        cronRequest({ 'x-vercel-cron-schedule': '0 0 * * *' })
      )
    ).toBe(false);
  });

  it('rejects unauthenticated requests in production', () => {
    expect(isAuthorizedCronRequest(cronRequest())).toBe(false);
  });

  it('allows local requests when CRON_SECRET is unset', () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAuthorizedCronRequest(cronRequest())).toBe(true);
  });

  it('accepts valid schedule when Bearer token is wrong', () => {
    expect(
      isAuthorizedCronRequest(
        cronRequest({
          authorization: 'Bearer wrong-secret',
          'x-vercel-cron-schedule': '*/5 * * * *',
        })
      )
    ).toBe(true);
  });
});
