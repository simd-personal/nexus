import { describe, expect, it } from 'vitest';
import {
  hasActiveSubscription,
  subscriptionStatusGrantsProAccess,
  isPaidPlan,
} from '@/lib/billing/plans';

describe('subscriptionStatusGrantsProAccess', () => {
  it('grants access for active, trialing, and past_due', () => {
    expect(subscriptionStatusGrantsProAccess('active')).toBe(true);
    expect(subscriptionStatusGrantsProAccess('trialing')).toBe(true);
    expect(subscriptionStatusGrantsProAccess('past_due')).toBe(true);
  });

  it('denies access for canceled and unpaid statuses', () => {
    expect(subscriptionStatusGrantsProAccess('canceled')).toBe(false);
    expect(subscriptionStatusGrantsProAccess('unpaid')).toBe(false);
    expect(subscriptionStatusGrantsProAccess('incomplete')).toBe(false);
    expect(subscriptionStatusGrantsProAccess(null)).toBe(false);
  });
});

describe('hasActiveSubscription', () => {
  it('returns true for paid plans in grace statuses', () => {
    expect(hasActiveSubscription('pro', 'active')).toBe(true);
    expect(hasActiveSubscription('pro_annual', 'trialing')).toBe(true);
    expect(hasActiveSubscription('pro', 'past_due')).toBe(true);
  });

  it('returns false for free plan or lapsed statuses', () => {
    expect(hasActiveSubscription('free', 'active')).toBe(false);
    expect(hasActiveSubscription('pro', 'canceled')).toBe(false);
    expect(hasActiveSubscription('pro', 'unpaid')).toBe(false);
  });
});

describe('isPaidPlan', () => {
  it('recognizes pro tiers only', () => {
    expect(isPaidPlan('pro')).toBe(true);
    expect(isPaidPlan('pro_annual')).toBe(true);
    expect(isPaidPlan('free')).toBe(false);
  });
});
