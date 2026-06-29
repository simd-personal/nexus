import { describe, expect, it, vi, afterEach } from 'vitest';
import { hasProAccess, isPremiumTestEmail } from '@/lib/billing/test-accounts';

describe('isPremiumTestEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('recognizes premium test accounts regardless of case', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isPremiumTestEmail('sim@test.com')).toBe(true);
    expect(isPremiumTestEmail('SIM@TEST.COM')).toBe(true);
    expect(isPremiumTestEmail('taegh@test.com')).toBe(true);
  });

  it('rejects other emails', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isPremiumTestEmail('other@example.com')).toBe(false);
    expect(isPremiumTestEmail(null)).toBe(false);
  });

  it('disables premium test bypass in production unless explicitly allowed', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ALLOW_PREMIUM_TEST_ACCOUNTS;
    expect(isPremiumTestEmail('sim@test.com')).toBe(false);
  });

  it('allows premium test bypass in production when ALLOW_PREMIUM_TEST_ACCOUNTS=true', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALLOW_PREMIUM_TEST_ACCOUNTS', 'true');
    expect(isPremiumTestEmail('sim@test.com')).toBe(true);
  });
});

describe('hasProAccess', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('grants Pro for active paid subscriptions', () => {
    expect(
      hasProAccess({ plan: 'pro', subscriptionStatus: 'active', accountType: 'individual' })
    ).toBe(true);
  });

  it('grants Pro during past_due grace period', () => {
    expect(
      hasProAccess({ plan: 'pro', subscriptionStatus: 'past_due', accountType: 'individual' })
    ).toBe(true);
  });

  it('grants Pro for enterprise accounts', () => {
    expect(hasProAccess({ accountType: 'enterprise', plan: 'free' })).toBe(true);
  });

  it('grants Pro for premium test emails in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
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
    vi.stubEnv('NODE_ENV', 'production');
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
