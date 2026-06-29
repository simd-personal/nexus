import { describe, expect, it, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';

const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelectEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockRetrieve = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    subscriptions: {
      retrieve: mockRetrieve,
    },
  })),
}));

import { handleCheckoutCompleted, handleInvoicePaymentFailed } from '@/lib/billing/webhook-handlers';
import { syncSubscriptionToProfile } from '@/lib/billing/sync-subscription';

function setupProfileLookup(userId = 'user-1') {
  mockSelect.mockReturnValue({ eq: mockSelectEq });
  mockSelectEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockMaybeSingle.mockResolvedValue({ data: { user_id: userId } });
  mockUpdate.mockReturnValue({ eq: mockUpdateEq });
  mockUpdateEq.mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });
}

describe('billing webhook handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupProfileLookup();
    mockRetrieve.mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      items: { data: [{ price: { id: 'price_monthly', recurring: { interval: 'month' } } }] },
    });
  });

  it('updates profile on checkout.session.completed', async () => {
    await handleCheckoutCompleted({
      client_reference_id: 'user-1',
      customer: 'cus_123',
      subscription: 'sub_123',
      metadata: { checkout_plan: 'pro' },
    } as Stripe.Checkout.Session);

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockRetrieve).toHaveBeenCalledWith('sub_123');
  });

  it('syncs subscription on invoice payment failure', async () => {
    await handleInvoicePaymentFailed({
      id: 'in_123',
      subscription: 'sub_123',
    } as Stripe.Invoice);

    expect(mockRetrieve).toHaveBeenCalledWith('sub_123');
  });

  it('downgrades profile when subscription is canceled', async () => {
    await syncSubscriptionToProfile({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'canceled',
      items: { data: [{ price: { id: 'price_monthly', recurring: { interval: 'month' } } }] },
    } as Stripe.Subscription);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'free',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
      })
    );
  });

  it('retains Pro during past_due sync', async () => {
    await syncSubscriptionToProfile({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'past_due',
      items: { data: [{ price: { id: 'price_monthly', recurring: { interval: 'month' } } }] },
    } as Stripe.Subscription);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'pro',
        stripe_subscription_id: 'sub_123',
        subscription_status: 'past_due',
      })
    );
  });
});
