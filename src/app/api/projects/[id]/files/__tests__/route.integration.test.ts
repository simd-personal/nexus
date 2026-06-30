import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockSelect = vi.fn();

vi.mock('@/lib/supabase/request-auth', () => ({
  requireRequestAuth: vi.fn(async () => ({
    user: { id: 'user-1' },
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => mockSelect(),
          }),
        }),
      }),
    },
    response: null,
  })),
}));

import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { GET } from '@/app/api/projects/[id]/files/route';

describe('GET /api/projects/[id]/files', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: { id: 'user-1' } as never,
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => mockSelect(),
            }),
          }),
        }),
      } as never,
      response: null,
    });
    mockSelect.mockResolvedValue({
      data: [{ id: 'file-1', file_name: 'notes.pdf', status: 'pending' }],
      error: null,
    });
  });

  it('returns project files for authenticated users', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/proj-1/files');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.files).toHaveLength(1);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: null,
      supabase: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as never,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1/files');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(401);
  });
});
