import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetDashboardUpdatesFeed = vi.fn();
const mockGetDashboardPortfolioPreference = vi.fn();

vi.mock('@/lib/supabase/request-auth', () => ({
  requireRequestAuth: vi.fn(async () => ({
    user: { id: 'user-1' },
    supabase: {},
    response: null,
  })),
}));

vi.mock('@/lib/data/queries', () => ({
  getDashboardUpdatesFeed: (...args: unknown[]) => mockGetDashboardUpdatesFeed(...args),
  getDashboardPortfolioPreference: (...args: unknown[]) => mockGetDashboardPortfolioPreference(...args),
}));

import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { GET } from '@/app/api/dashboard/updates/route';

describe('GET /api/dashboard/updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: { id: 'user-1' } as never,
      supabase: {} as never,
      response: null,
    });
    mockGetDashboardPortfolioPreference.mockResolvedValue('work');
    mockGetDashboardUpdatesFeed.mockResolvedValue({
      updates: [{ id: 'update-1', title: 'Ready' }],
      pendingBatches: [],
      pendingFiles: [],
      indexingActive: false,
    });
  });

  it('returns feed data for authenticated users', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/updates?portfolio=work&limit=5');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updates).toHaveLength(1);
    expect(mockGetDashboardUpdatesFeed).toHaveBeenCalledWith(5, 'work', {});
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: null,
      supabase: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as never,
    });
    const req = new NextRequest('http://localhost:3000/api/dashboard/updates');
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(mockGetDashboardUpdatesFeed).not.toHaveBeenCalled();
  });
});
