import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrlFromRequest } from '@/lib/auth/site-url';
import { getOrCreateStripeCustomer } from '@/lib/billing/customer';
import { checkoutPlanToBillingPlan } from '@/lib/billing/plans';
import type { CheckoutPlanId } from '@/lib/billing/plans';
import { getStripe } from '@/lib/stripe/client';
import { resolveStripePriceId } from '@/lib/stripe/prices';

function parsePlan(plan: string | null): CheckoutPlanId | null {
  if (plan === 'pro' || plan === 'pro-annual') return plan;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = parsePlan(typeof body.plan === 'string' ? body.plan : null);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan, subscription_status, account_type')
      .eq('user_id', user.id)
      .single();

    if (profile?.account_type === 'enterprise') {
      return NextResponse.json(
        { error: 'Organization accounts are billed via quote.' },
        { status: 400 }
      );
    }

    if (
      profile?.plan === checkoutPlanToBillingPlan(plan) &&
      (profile.subscription_status === 'active' || profile.subscription_status === 'trialing')
    ) {
      return NextResponse.json({ error: 'Already subscribed to this plan.' }, { status: 400 });
    }

    const siteUrl = getSiteUrlFromRequest(request);
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
      return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
