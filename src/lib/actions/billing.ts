'use server';

import { redirect } from 'next/navigation';
import { createClient, requireUser } from '@/lib/supabase/server';
import { getSiteUrlFromHeaders } from '@/lib/auth/site-url';
import { getOrCreateStripeCustomer } from '@/lib/billing/customer';
import { checkoutPlanToBillingPlan, type CheckoutPlanId } from '@/lib/billing/plans';
import { getStripe } from '@/lib/stripe/client';
import { resolveStripePriceId } from '@/lib/stripe/prices';

function parseCheckoutPlan(plan: string | null | undefined): CheckoutPlanId | null {
  if (plan === 'pro' || plan === 'pro-annual') return plan;
  return null;
}

export async function createCheckoutSession(planInput: string) {
  const plan = parseCheckoutPlan(planInput);
  if (!plan) {
    return { error: 'Invalid plan. Choose Pro monthly or Pro annual.' };
  }

  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, subscription_status, account_type')
    .eq('user_id', user.id)
    .single();

  if (profile?.account_type === 'enterprise') {
    return { error: 'Organization accounts are billed via quote. Contact us for enterprise pricing.' };
  }

  if (
    profile?.plan === checkoutPlanToBillingPlan(plan) &&
    (profile.subscription_status === 'active' || profile.subscription_status === 'trialing')
  ) {
    return { error: 'You already have an active subscription on this plan.' };
  }

  const siteUrl = await getSiteUrlFromHeaders();
  const customerId = await getOrCreateStripeCustomer({
    userId: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name,
  });

  const stripe = getStripe();
  const priceId = await resolveStripePriceId(plan);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/settings?billing=success`,
    cancel_url: `${siteUrl}/settings?billing=canceled`,
    client_reference_id: user.id,
    metadata: {
      supabase_user_id: user.id,
      checkout_plan: plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        checkout_plan: plan,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return { error: 'Could not start checkout. Please try again.' };
  }

  redirect(session.url);
}

export async function createBillingPortalSession() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('user_id', user.id)
    .single();

  const customerId =
    profile?.stripe_customer_id ??
    (await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email ?? '',
      fullName: profile?.full_name,
    }));

  const siteUrl = await getSiteUrlFromHeaders();
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/settings`,
  });

  redirect(session.url);
}
