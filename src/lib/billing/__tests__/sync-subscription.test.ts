import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import {
  planFromSubscription,
  subscriptionRetainsPaidPlan,
} from '@/lib/billing/sync-subscription';

function makeSubscription(
  overrides: Partial<Stripe.Subscription> & Pick<Stripe.Subscription, 'status'>
): Stripe.Subscription {
  return {
    id: 'sub_123',
    customer: 'cus_123',
    items: {
      data: [
        {
          price: {
            id: 'price_monthly',
            recurring: { interval: 'month' },
          },
        } as Stripe.SubscriptionItem,
      ],
    } as Stripe.ApiList<Stripe.SubscriptionItem>,
    ...overrides,
  } as Stripe.Subscription;
}

describe('subscriptionRetainsPaidPlan', () => {
  it('retains paid access for active, trialing, and past_due', () => {
    expect(subscriptionRetainsPaidPlan('active')).toBe(true);
    expect(subscriptionRetainsPaidPlan('trialing')).toBe(true);
    expect(subscriptionRetainsPaidPlan('past_due')).toBe(true);
  });

  it('revokes paid access for canceled and unpaid', () => {
    expect(subscriptionRetainsPaidPlan('canceled')).toBe(false);
    expect(subscriptionRetainsPaidPlan('unpaid')).toBe(false);
    expect(subscriptionRetainsPaidPlan('incomplete')).toBe(false);
  });
});

describe('planFromSubscription', () => {
  const originalMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const originalAnnual = process.env.STRIPE_PRICE_PRO_ANNUAL;

  it('maps env price IDs to billing plans', () => {
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_monthly_env';
    process.env.STRIPE_PRICE_PRO_ANNUAL = 'price_annual_env';

    expect(
      planFromSubscription(
        makeSubscription({
          status: 'active',
          items: {
            data: [{ price: { id: 'price_monthly_env', recurring: { interval: 'month' } } }],
          } as Stripe.ApiList<Stripe.SubscriptionItem>,
        })
      )
    ).toBe('pro');

    expect(
      planFromSubscription(
        makeSubscription({
          status: 'active',
          items: {
            data: [{ price: { id: 'price_annual_env', recurring: { interval: 'year' } } }],
          } as Stripe.ApiList<Stripe.SubscriptionItem>,
        })
      )
    ).toBe('pro_annual');

    process.env.STRIPE_PRICE_PRO_MONTHLY = originalMonthly;
    process.env.STRIPE_PRICE_PRO_ANNUAL = originalAnnual;
  });

  it('falls back to interval when env price IDs are unset', () => {
    delete process.env.STRIPE_PRICE_PRO_MONTHLY;
    delete process.env.STRIPE_PRICE_PRO_ANNUAL;

    expect(planFromSubscription(makeSubscription({ status: 'active' }))).toBe('pro');
    expect(
      planFromSubscription(
        makeSubscription({
          status: 'active',
          items: {
            data: [{ price: { id: 'unknown', recurring: { interval: 'year' } } }],
          } as Stripe.ApiList<Stripe.SubscriptionItem>,
        })
      )
    ).toBe('pro_annual');

    process.env.STRIPE_PRICE_PRO_MONTHLY = originalMonthly;
    process.env.STRIPE_PRICE_PRO_ANNUAL = originalAnnual;
  });
});
