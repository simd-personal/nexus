import { describe, expect, it } from 'vitest';
import { buildBillingStatusSnapshot } from '@/lib/billing/billing-status';

describe('buildBillingStatusSnapshot', () => {
  it('marks past_due subscribers as Pro with an active Stripe subscription', () => {
    const snapshot = buildBillingStatusSnapshot({
      plan: 'pro',
      subscription_status: 'past_due',
      account_type: 'individual',
      email: 'user@example.com',
    });

    expect(snapshot.is_pro).toBe(true);
    expect(snapshot.has_stripe_subscription).toBe(true);
    expect(snapshot.plan_label).toBe('Pro (monthly)');
  });

  it('marks free users without Pro access', () => {
    const snapshot = buildBillingStatusSnapshot({
      plan: 'free',
      subscription_status: null,
      account_type: 'individual',
      email: 'user@example.com',
    });

    expect(snapshot.is_pro).toBe(false);
    expect(snapshot.has_stripe_subscription).toBe(false);
  });
});
