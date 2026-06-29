import {
  checkoutPlanToBillingPlan,
  hasActiveSubscription,
  type CheckoutPlanId,
} from '@/lib/billing/plans';

export interface CheckoutProfile {
  plan?: string | null;
  subscription_status?: string | null;
  account_type?: string | null;
}

export type CheckoutGuardResult =
  | { allowed: true }
  | { allowed: false; error: string; usePortal: boolean };

/**
 * Whether a user may start a new Stripe Checkout session. Blocks duplicate
 * subscriptions (including monthly → annual) and enterprise accounts.
 */
export function validateCheckoutEligibility(
  profile: CheckoutProfile | null | undefined,
  plan: CheckoutPlanId
): CheckoutGuardResult {
  if (profile?.account_type === 'enterprise') {
    return {
      allowed: false,
      error: 'Organization accounts are billed via quote.',
      usePortal: false,
    };
  }

  const targetPlan = checkoutPlanToBillingPlan(plan);
  const hasPaidSub = hasActiveSubscription(profile?.plan, profile?.subscription_status);

  if (hasPaidSub && profile?.plan === targetPlan) {
    return {
      allowed: false,
      error: 'You already have an active subscription on this plan.',
      usePortal: true,
    };
  }

  if (hasPaidSub) {
    return {
      allowed: false,
      error:
        'You already have an active subscription. Use Manage billing in Settings to change plans or cancel.',
      usePortal: true,
    };
  }

  return { allowed: true };
}
