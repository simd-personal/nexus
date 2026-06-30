import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockGetDashboardUpdatesFeed = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/data/queries', () => ({
  getDashboardUpdatesFeed: (...args: unknown[]) => mockGetDashboardUpdatesFeed(...args),
}));

import { GET } from '@/app/api/dashboard/updates/route';

describe('GET /api/dashboard/updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockGetDashboardUpdatesFeed.mockResolvedValue({
      updates: [{ id: 'update-1', title: 'Ready' }],
      pendingBatches: [],
      indexingActive: false,
    });
  });

  it('returns feed data for authenticated users', async () => {
    const req = new NextRequest('http://localhost:3000/api/dashboard/updates?portfolio=work&limit=5');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updates).toHaveLength(1);
    expect(mockGetDashboardUpdatesFeed).toHaveBeenCalledWith(5, 'work');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/dashboard/updates');
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(mockGetDashboardUpdatesFeed).not.toHaveBeenCalled();
  });
});
