import { describe, expect, it } from 'vitest';
import { getSubscriptionAlert, subscriptionStatusLabel } from '@/lib/billing/subscription-ui';

describe('getSubscriptionAlert', () => {
  it('warns on past_due subscriptions', () => {
    const alert = getSubscriptionAlert({
      subscriptionStatus: 'past_due',
      isPro: true,
      hasStripeSubscription: true,
    });
    expect(alert?.tone).toBe('warning');
    expect(alert?.showManageBilling).toBe(true);
  });

  it('returns null for active subscriptions', () => {
    expect(
      getSubscriptionAlert({
        subscriptionStatus: 'active',
        isPro: true,
        hasStripeSubscription: true,
      })
    ).toBeNull();
  });
});

describe('subscriptionStatusLabel', () => {
  it('humanizes known statuses', () => {
    expect(subscriptionStatusLabel('past_due')).toBe('Past due');
    expect(subscriptionStatusLabel('trialing')).toBe('Trial');
  });
});
