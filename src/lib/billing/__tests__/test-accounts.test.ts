import { describe, expect, it } from 'vitest';
import { hasProAccess, isPremiumTestEmail } from '@/lib/billing/test-accounts';

describe('isPremiumTestEmail', () => {
  it('recognizes the demo account regardless of case', () => {
    expect(isPremiumTestEmail('sim@test.com')).toBe(true);
    expect(isPremiumTestEmail('SIM@TEST.COM')).toBe(true);
  });

  it('rejects other emails', () => {
    expect(isPremiumTestEmail('other@example.com')).toBe(false);
    expect(isPremiumTestEmail(null)).toBe(false);
  });
});

describe('hasProAccess', () => {
  it('grants Pro for active paid subscriptions', () => {
    expect(
      hasProAccess({ plan: 'pro', subscriptionStatus: 'active', accountType: 'individual' })
    ).toBe(true);
  });

  it('grants Pro for enterprise accounts', () => {
    expect(hasProAccess({ accountType: 'enterprise', plan: 'free' })).toBe(true);
  });

  it('grants Pro for premium test emails even on free plan', () => {
    expect(
      hasProAccess({
        plan: 'free',
        subscriptionStatus: null,
        accountType: 'individual',
        email: 'sim@test.com',
      })
    ).toBe(true);
  });

  it('denies Pro for free personal accounts', () => {
    expect(
      hasProAccess({
        plan: 'free',
        subscriptionStatus: null,
        accountType: 'individual',
        email: 'user@example.com',
      })
    ).toBe(false);
  });
});
