import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/inbound/addresses', () => ({
  buildProjectInboundAddress: (token: string) => `p.${token}@inbound.upperdeck.dev`,
}));

vi.mock('@/lib/supabase/request-auth', () => ({
  requireRequestAuth: vi.fn(),
}));

import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { GET } from '@/app/api/projects/[id]/inbound/route';

describe('GET /api/projects/[id]/inbound', () => {
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
                  data: {
                    id: 'proj-1',
                    inbound_token: 'tok456',
                    client_name: 'Acme',
                    project_name: 'Rollout',
                  },
                  error: null,
                }),
            }),
          }),
        }),
      } as never,
      response: null,
    });
  });

  it('returns the project forwarding address', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/proj-1/inbound');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.address).toBe('p.tok456@inbound.upperdeck.dev');
    expect(body.subject_hint).toBe('[Acme · Rollout]');
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: null,
      supabase: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as never,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1/inbound');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(401);
  });
});
