import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockGetOrCreateStripeCustomer = vi.fn();
const mockResolveStripePriceId = vi.fn();
const mockCheckoutCreate = vi.fn();

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

vi.mock('@/lib/billing/customer', () => ({
  getOrCreateStripeCustomer: (...args: unknown[]) => mockGetOrCreateStripeCustomer(...args),
}));

vi.mock('@/lib/stripe/prices', () => ({
  resolveStripePriceId: (...args: unknown[]) => mockResolveStripePriceId(...args),
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: mockCheckoutCreate,
      },
    },
  })),
}));

import { POST } from '@/app/api/stripe/checkout/route';

describe('POST /api/stripe/checkout integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@example.com' } } });
    mockSingle.mockResolvedValue({
      data: {
        full_name: 'User',
        plan: 'free',
        subscription_status: null,
        account_type: 'individual',
      },
    });
    mockGetOrCreateStripeCustomer.mockResolvedValue('cus_123');
    mockResolveStripePriceId.mockResolvedValue('price_123');
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/session' });
  });

  it('returns checkout URL for eligible free users', async () => {
    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.test/session');
    expect(mockCheckoutCreate).toHaveBeenCalledOnce();
  });

  it('blocks duplicate checkout for active subscribers', async () => {
    mockSingle.mockResolvedValue({
      data: {
        full_name: 'User',
        plan: 'pro',
        subscription_status: 'active',
        account_type: 'individual',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro-annual' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.usePortal).toBe(true);
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('blocks enterprise accounts', async () => {
    mockSingle.mockResolvedValue({
      data: {
        full_name: 'Org Admin',
        plan: 'free',
        subscription_status: null,
        account_type: 'enterprise',
      },
    });

    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.usePortal).toBe(false);
    expect(body.error).toContain('quote');
  });

  it('requires authentication', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
