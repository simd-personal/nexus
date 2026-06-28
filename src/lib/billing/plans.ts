export type BillingPlan = 'free' | 'pro' | 'pro_annual';

export type CheckoutPlanId = 'pro' | 'pro-annual';

export const FREE_PROJECT_LIMIT = 1;
export const FREE_CHAT_MESSAGES_PER_MONTH = 25;

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
  return subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
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
