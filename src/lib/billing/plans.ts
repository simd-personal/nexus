export type BillingPlan = 'free' | 'pro' | 'pro_annual';

export type CheckoutPlanId = 'pro' | 'pro-annual';

export const FREE_PROJECT_LIMIT = 1;
export const FREE_CHAT_MESSAGES_PER_MONTH = 25;
/** Soft monthly cap for Pro — prevents runaway scripted abuse. */
export const PRO_CHAT_MESSAGES_PER_MONTH = 500;

/** Stripe statuses that keep Pro access (including payment grace period). */
export const PAID_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due'] as const;

export type PaidSubscriptionStatus = (typeof PAID_SUBSCRIPTION_STATUSES)[number];

export function subscriptionStatusGrantsProAccess(
  subscriptionStatus: string | null | undefined
): boolean {
  if (!subscriptionStatus) return false;
  return (PAID_SUBSCRIPTION_STATUSES as readonly string[]).includes(subscriptionStatus);
}

export function checkoutPlanToBillingPlan(plan: CheckoutPlanId): BillingPlan {
  return plan === 'pro-annual' ? 'pro_annual' : 'pro';
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return plan === 'pro' || plan === 'pro_annual';
}

export function hasActiveSubscription(
  plan: string | null | undefined,
  subscriptionStatus: string | null | undefined
): boolean {
  if (!isPaidPlan(plan)) return false;
  return subscriptionStatusGrantsProAccess(subscriptionStatus);
}

export function planDisplayName(plan: string | null | undefined): string {
  switch (plan) {
    case 'pro':
      return 'Pro (monthly)';
    case 'pro_annual':
      return 'Pro (annual)';
    default:
      return 'Free';
  }
}
