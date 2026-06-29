import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

import { GET } from '@/app/api/billing/status/route';

describe('GET /api/billing/status integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
  });

  it('returns Pro snapshot for past_due subscribers', async () => {
    mockSingle.mockResolvedValue({
      data: {
        plan: 'pro',
        subscription_status: 'past_due',
        account_type: 'individual',
      },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.is_pro).toBe(true);
    expect(body.has_stripe_subscription).toBe(true);
    expect(body.plan).toBe('pro');
  });

  it('returns free snapshot for unpaid users', async () => {
    mockSingle.mockResolvedValue({
      data: {
        plan: 'free',
        subscription_status: null,
        account_type: 'individual',
      },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.is_pro).toBe(false);
    expect(body.has_stripe_subscription).toBe(false);
  });

  it('requires authentication', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
