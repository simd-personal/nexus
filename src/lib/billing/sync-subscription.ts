import type Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/admin';
import { billingPlanFromPriceId } from '@/lib/stripe/prices';
import {
  subscriptionStatusGrantsProAccess,
  type BillingPlan,
} from '@/lib/billing/plans';

export function planFromSubscription(subscription: Stripe.Subscription): BillingPlan {
  const priceId = subscription.items.data[0]?.price?.id;
  const fromEnv = billingPlanFromPriceId(priceId);
  if (fromEnv) return fromEnv;

  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  return interval === 'year' ? 'pro_annual' : 'pro';
}

export function subscriptionRetainsPaidPlan(status: Stripe.Subscription.Status): boolean {
  return subscriptionStatusGrantsProAccess(status);
}

export async function syncSubscriptionToProfile(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!profile) return;

  const retainsPaid = subscriptionRetainsPaidPlan(subscription.status);

  await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: retainsPaid ? subscription.id : null,
      plan: retainsPaid ? planFromSubscription(subscription) : 'free',
      subscription_status: subscription.status,
    })
    .eq('user_id', profile.user_id);
}

export async function resetProfileBilling(customerId: string) {
  const supabase = createServiceClient();
  await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: null,
      plan: 'free',
      subscription_status: 'canceled',
    })
    .eq('stripe_customer_id', customerId);
}
