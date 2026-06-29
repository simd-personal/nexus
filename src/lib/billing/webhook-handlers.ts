import type Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/admin';
import { checkoutPlanToBillingPlan } from '@/lib/billing/plans';
import { syncSubscriptionToProfile } from '@/lib/billing/sync-subscription';
import { getStripe } from '@/lib/stripe/client';

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
  const checkoutPlan = session.metadata?.checkout_plan;

  if (!userId || !customerId) return;

  const supabase = createServiceClient();
  const updates: Record<string, string | null> = {
    stripe_customer_id: customerId,
  };

  if (subscriptionId) {
    updates.stripe_subscription_id = subscriptionId;
  }

  if (checkoutPlan === 'pro' || checkoutPlan === 'pro-annual') {
    updates.plan = checkoutPlanToBillingPlan(checkoutPlan);
    updates.subscription_status = 'active';
  }

  await supabase.from('profiles').update(updates).eq('user_id', userId);

  if (subscriptionId) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionToProfile(subscription);
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionRef = (
    invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
  ).subscription;
  const subscriptionId =
    typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;
  if (!subscriptionId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionToProfile(subscription);
}
