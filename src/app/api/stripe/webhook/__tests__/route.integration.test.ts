import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockConstructEvent = vi.fn();
const mockHandleCheckoutCompleted = vi.fn();
const mockSyncSubscriptionToProfile = vi.fn();
const mockHandleInvoicePaymentFailed = vi.fn();

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  })),
}));

vi.mock('@/lib/billing/webhook-handlers', () => ({
  handleCheckoutCompleted: (...args: unknown[]) => mockHandleCheckoutCompleted(...args),
  handleInvoicePaymentFailed: (...args: unknown[]) => mockHandleInvoicePaymentFailed(...args),
}));

vi.mock('@/lib/billing/sync-subscription', () => ({
  syncSubscriptionToProfile: (...args: unknown[]) => mockSyncSubscriptionToProfile(...args),
}));

import { POST } from '@/app/api/stripe/webhook/route';

describe('POST /api/stripe/webhook integration', () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mockConstructEvent.mockImplementation((_body, _sig, _secret) => ({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test' } },
    }));
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it('handles checkout.session.completed', async () => {
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{}',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockHandleCheckoutCompleted).toHaveBeenCalledOnce();
  });

  it('handles customer.subscription.updated', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_test', status: 'past_due' } },
    });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{}',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSyncSubscriptionToProfile).toHaveBeenCalledOnce();
  });

  it('handles invoice.payment_failed', async () => {
    mockConstructEvent.mockReturnValueOnce({
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_test', subscription: 'sub_test' } },
    });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{}',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockHandleInvoicePaymentFailed).toHaveBeenCalledOnce();
  });

  it('rejects missing webhook secret configuration', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('rejects invalid signatures', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('invalid signature');
    });

    const req = new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'bad_sig' },
      body: '{}',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
