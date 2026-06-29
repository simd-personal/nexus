import { describe, expect, it } from 'vitest';
import { validateCheckoutEligibility } from '@/lib/billing/checkout-guard';

describe('validateCheckoutEligibility', () => {
  it('allows checkout for free users', () => {
    expect(validateCheckoutEligibility({ plan: 'free', subscription_status: null }, 'pro')).toEqual({
      allowed: true,
    });
  });

  it('blocks enterprise accounts', () => {
    const result = validateCheckoutEligibility(
      { account_type: 'enterprise', plan: 'free' },
      'pro'
    );
    expect(result).toEqual({
      allowed: false,
      error: 'Organization accounts are billed via quote.',
      usePortal: false,
    });
  });

  it('blocks duplicate subscription on the same plan', () => {
    const result = validateCheckoutEligibility(
      { plan: 'pro', subscription_status: 'active' },
      'pro'
    );
    expect(result.allowed).toBe(false);
    expect(result).toMatchObject({ usePortal: true });
  });

  it('blocks checkout when switching plans with an active subscription', () => {
    const result = validateCheckoutEligibility(
      { plan: 'pro', subscription_status: 'active' },
      'pro-annual'
    );
    expect(result.allowed).toBe(false);
    expect(result).toMatchObject({ usePortal: true });
  });

  it('allows checkout after cancellation', () => {
    expect(
      validateCheckoutEligibility({ plan: 'free', subscription_status: 'canceled' }, 'pro-annual')
    ).toEqual({ allowed: true });
  });

  it('blocks checkout during past_due grace (use portal instead)', () => {
    const result = validateCheckoutEligibility(
      { plan: 'pro', subscription_status: 'past_due' },
      'pro-annual'
    );
    expect(result.allowed).toBe(false);
    expect(result).toMatchObject({ usePortal: true });
  });
});
