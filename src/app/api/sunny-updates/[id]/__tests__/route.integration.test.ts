import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSunnyUpdateById = vi.fn();

vi.mock('@/lib/supabase/request-auth', () => ({
  requireRequestAuth: vi.fn(async () => ({
    user: { id: 'user-1' },
    supabase: {},
    response: null,
  })),
}));

vi.mock('@/lib/data/queries', () => ({
  getSunnyUpdateById: (...args: unknown[]) => mockGetSunnyUpdateById(...args),
}));

import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { GET } from '@/app/api/sunny-updates/[id]/route';

describe('GET /api/sunny-updates/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: { id: 'user-1' } as never,
      supabase: {} as never,
      response: null,
    });
    mockGetSunnyUpdateById.mockResolvedValue({
      id: 'update-1',
      title: 'Epic transition readiness risks',
      summary: 'Full summary text',
      created_at: '2026-06-30T10:00:00.000Z',
    });
  });

  it('returns a sunny update for authenticated users', async () => {
    const req = new NextRequest('http://localhost:3000/api/sunny-updates/update-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'update-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.update.id).toBe('update-1');
    expect(mockGetSunnyUpdateById).toHaveBeenCalledWith('update-1', {});
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns 404 when update is missing', async () => {
    mockGetSunnyUpdateById.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sunny-updates/missing');
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) });

    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: null,
      supabase: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as never,
    });
    const req = new NextRequest('http://localhost:3000/api/sunny-updates/update-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'update-1' }) });

    expect(res.status).toBe(401);
    expect(mockGetSunnyUpdateById).not.toHaveBeenCalled();
  });
});
