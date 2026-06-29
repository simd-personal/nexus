import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockSweep = vi.fn();

vi.mock('@/lib/processing/sweep-stale-files', () => ({
  sweepStaleFiles: (...args: unknown[]) => mockSweep(...args),
}));

import { GET } from '@/app/api/cron/sweep-files/route';

describe('GET /api/cron/sweep-files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    mockSweep.mockResolvedValue({
      scanned: 2,
      kicked: 1,
      skipped: 1,
      file_ids: ['file-1'],
      errors: [],
    });
  });

  it('rejects requests without cron auth in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = GET(new NextRequest('http://localhost:3000/api/cron/sweep-files'));
    return expect(res).resolves.toMatchObject({ status: 401 });
  });

  it('accepts Vercel cron schedule header in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await GET(
      new NextRequest('http://localhost:3000/api/cron/sweep-files', {
        headers: { 'x-vercel-cron-schedule': '*/5 * * * *' },
      })
    );
    expect(res.status).toBe(200);
    expect(mockSweep).toHaveBeenCalled();
  });

  it('runs the stale-file sweep with cron auth', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = await GET(
      new NextRequest('http://localhost:3000/api/cron/sweep-files', {
        headers: { authorization: 'Bearer test-cron-secret' },
      })
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.kicked).toBe(1);
    expect(mockSweep).toHaveBeenCalled();
  });
});
