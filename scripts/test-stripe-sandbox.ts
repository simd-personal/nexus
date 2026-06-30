/**
 * Live Stripe test-mode checkout + subscription sync for Pro monthly and annual.
 * Usage: npm run test:stripe
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import type { CheckoutPlanId } from '../src/lib/billing/plans';
import { checkoutPlanToBillingPlan } from '../src/lib/billing/plans';
import { getOrCreateStripeCustomer } from '../src/lib/billing/customer';
import { handleCheckoutCompleted } from '../src/lib/billing/webhook-handlers';
import { syncSubscriptionToProfile } from '../src/lib/billing/sync-subscription';
import { getStripe } from '../src/lib/stripe/client';
import { resolveStripePriceId } from '../src/lib/stripe/prices';

config({ path: resolve(process.cwd(), '.env.local') });

type PlanCase = {
  checkoutPlan: CheckoutPlanId;
  expectedBillingPlan: 'pro' | 'pro_annual';
  label: string;
};

const PLAN_CASES: PlanCase[] = [
  { checkoutPlan: 'pro', expectedBillingPlan: 'pro', label: 'Pro monthly' },
  { checkoutPlan: 'pro-annual', expectedBillingPlan: 'pro_annual', label: 'Pro annual' },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function attachTestPaymentMethod(customerId: string) {
  const stripe = getStripe();
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: { token: 'tok_visa' },
  });
  await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });
  return paymentMethod.id;
}

async function readProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('plan, subscription_status, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!stripeKey?.startsWith('sk_test_')) {
    throw new Error('Refusing to run: STRIPE_SECRET_KEY must be a test key (sk_test_…)');
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const stripe = getStripe();

  const email = `stripe-sandbox-${Date.now()}@example.com`;
  const password = `SandboxTest${Date.now()}!`;
  let userId: string | null = null;
  let customerId: string | null = null;

  console.log('Stripe sandbox checkout test\n');

  try {
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Stripe Sandbox Test',
        account_type: 'individual',
      },
    });
    if (createError || !created.user) {
      throw createError ?? new Error('Could not create sandbox user');
    }

    userId = created.user.id;
    console.log(`✓ Created test user ${email}`);

    customerId = await getOrCreateStripeCustomer({
      userId,
      email,
      fullName: 'Stripe Sandbox Test',
    });
    await attachTestPaymentMethod(customerId);
    console.log(`✓ Stripe customer ${customerId} ready with test card\n`);

    for (const planCase of PLAN_CASES) {
      console.log(planCase.label);

      const priceId = await resolveStripePriceId(planCase.checkoutPlan);
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: 'http://localhost:3000/settings?billing=success',
        cancel_url: 'http://localhost:3000/settings?billing=canceled',
        client_reference_id: userId,
        metadata: {
          supabase_user_id: userId,
          checkout_plan: planCase.checkoutPlan,
        },
      });

      assert(session.url, 'Checkout session URL missing');
      console.log(`  ✓ Checkout session ${session.id}`);

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          supabase_user_id: userId,
          checkout_plan: planCase.checkoutPlan,
        },
      });

      await handleCheckoutCompleted({
        id: session.id,
        client_reference_id: userId,
        customer: customerId,
        subscription: subscription.id,
        metadata: { checkout_plan: planCase.checkoutPlan },
      } as never);

      let profile = await readProfile(supabase, userId);
      assert(profile.plan === planCase.expectedBillingPlan, `Expected plan ${planCase.expectedBillingPlan}, got ${profile.plan}`);
      assert(profile.subscription_status === 'active', `Expected active status, got ${profile.subscription_status}`);
      assert(profile.stripe_subscription_id === subscription.id, 'Subscription id not stored on profile');
      console.log(`  ✓ Profile synced (${profile.plan}, ${profile.subscription_status})`);

      const canceled = await stripe.subscriptions.cancel(subscription.id);
      await syncSubscriptionToProfile(canceled);

      profile = await readProfile(supabase, userId);
      assert(profile.plan === 'free', `Expected free after cancel, got ${profile.plan}`);
      assert(profile.subscription_status === 'canceled', `Expected canceled status, got ${profile.subscription_status}`);
      assert(profile.stripe_subscription_id === null, 'Subscription id should clear after cancel');
      console.log('  ✓ Cancel returns profile to free\n');
    }

    console.log('✅ Stripe sandbox test passed for all paid plans.');
    console.log(`   Billing plan mapping: pro → ${checkoutPlanToBillingPlan('pro')}, pro-annual → ${checkoutPlanToBillingPlan('pro-annual')}`);
  } finally {
    if (customerId) {
      try {
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
        for (const sub of subs.data) {
          if (sub.status !== 'canceled') {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
        await stripe.customers.del(customerId);
        console.log(`\n✓ Cleaned up Stripe customer ${customerId}`);
      } catch (error) {
        console.warn('⚠ Stripe cleanup failed:', error instanceof Error ? error.message : error);
      }
    }

    if (userId) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log(`✓ Deleted test user ${email}`);
      } catch (error) {
        console.warn('⚠ Supabase cleanup failed:', error instanceof Error ? error.message : error);
      }
    }
  }
}

main().catch((error) => {
  console.error('\n❌ Stripe sandbox test failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
