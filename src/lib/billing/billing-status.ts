import { hasActiveSubscription, planDisplayName } from '@/lib/billing/plans';
import { hasProAccess, isPremiumTestEmail } from '@/lib/billing/test-accounts';

export interface BillingStatusInput {
  plan?: string | null;
  subscription_status?: string | null;
  account_type?: string | null;
  email?: string | null;
}

export interface BillingStatusSnapshot {
  plan: string;
  subscription_status: string | null;
  plan_label: string;
  is_pro: boolean;
  has_stripe_subscription: boolean;
  is_test_premium: boolean;
}

export function buildBillingStatusSnapshot(input: BillingStatusInput): BillingStatusSnapshot {
  const plan = input.plan ?? 'free';
  const subscriptionStatus = input.subscription_status ?? null;
  const isTestPremium = isPremiumTestEmail(input.email);
  const isPro = hasProAccess({
    plan: input.plan,
    subscriptionStatus: input.subscription_status,
    accountType: input.account_type,
    email: input.email,
  });
  const hasStripeSubscription = hasActiveSubscription(input.plan, input.subscription_status);

  return {
    plan,
    subscription_status: subscriptionStatus,
    plan_label: isTestPremium && !hasStripeSubscription ? 'Pro (test account)' : planDisplayName(plan),
    is_pro: isPro,
    has_stripe_subscription: hasStripeSubscription,
    is_test_premium: isTestPremium,
  };
}
