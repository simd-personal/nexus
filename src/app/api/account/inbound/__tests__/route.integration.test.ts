import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/inbound/addresses', () => ({
  buildUserInboundAddress: (token: string) => `u.${token}@inbound.upperdeck.dev`,
}));

vi.mock('@/lib/supabase/request-auth', () => ({
  requireRequestAuth: vi.fn(async () => ({
    user: { id: 'user-1' },
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { inbound_token: 'abc123' },
                error: null,
              }),
          }),
        }),
      }),
    },
    response: null,
  })),
}));

import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { GET } from '@/app/api/account/inbound/route';

describe('GET /api/account/inbound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: { id: 'user-1' } as never,
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { inbound_token: 'abc123' },
                  error: null,
                }),
            }),
          }),
        }),
      } as never,
      response: null,
    });
  });

  it('returns the user smart inbox address', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/inbound');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.address).toBe('u.abc123@inbound.upperdeck.dev');
    expect(body.subject_hint).toContain('subject');
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: null,
      supabase: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as never,
    });

    const req = new NextRequest('http://localhost:3000/api/account/inbound');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
