/**
 * Pre-flight checklist before enabling live Stripe billing.
 * Usage: npm run verify-stripe-live
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(process.cwd(), '.env.local') });

function isPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('sk_test_your') ||
    lower.includes('whsec_your') ||
    lower.includes('price_your') ||
    lower.startsWith('sk_test_xxx')
  );
}

function isLiveKey(value: string | undefined): boolean {
  return Boolean(value?.startsWith('sk_live_'));
}

function isTestKey(value: string | undefined): boolean {
  return Boolean(value?.startsWith('sk_test_'));
}

const required: Array<{ key: string; hint: string }> = [
  { key: 'STRIPE_SECRET_KEY', hint: 'Stripe Dashboard → Developers → API keys' },
  { key: 'STRIPE_WEBHOOK_SECRET', hint: 'Stripe Dashboard → Webhooks → signing secret for /api/stripe/webhook' },
  { key: 'STRIPE_PRICE_PRO_MONTHLY', hint: 'Run npm run stripe:setup or copy price id from Stripe' },
  { key: 'STRIPE_PRICE_PRO_ANNUAL', hint: 'Run npm run stripe:setup or copy price id from Stripe' },
];

console.log('UpperDeck Stripe go-live checklist\n');

let ok = true;
const mode = process.env.STRIPE_LIVE_MODE === '1' ? 'live' : 'test';

for (const { key, hint } of required) {
  const value = process.env[key];
  if (isPlaceholder(value)) {
    console.log(`❌ ${key}`);
    console.log(`   → ${hint}\n`);
    ok = false;
  } else {
    console.log(`✓  ${key}`);
  }
}

const secret = process.env.STRIPE_SECRET_KEY?.trim();
if (secret) {
  if (mode === 'live' && !isLiveKey(secret)) {
    console.log('\n❌ STRIPE_LIVE_MODE=1 but STRIPE_SECRET_KEY is not a live key (sk_live_…)');
    ok = false;
  }
  if (mode === 'test' && isLiveKey(secret)) {
    console.log('\n⚠  STRIPE_SECRET_KEY is live while STRIPE_LIVE_MODE is not set. Confirm intentionally.');
  }
}

const siteUrl = process.env.AUTH_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
console.log(`\nSite URL for checkout redirects: ${siteUrl ?? '(not set — set AUTH_SITE_URL in production)'}`);
if (!siteUrl || siteUrl.includes('localhost')) {
  console.log('⚠  Production checkout should use your public domain (e.g. https://upperdeck.dev)');
}

async function verifyStripeConnectivity() {
  if (!secret || isPlaceholder(secret)) return;

  const stripe = new Stripe(secret, { apiVersion: '2026-06-24.dahlia' });
  const account = await stripe.accounts.retrieve();
  console.log(`\n✓  Stripe account: ${account.settings?.dashboard?.display_name ?? account.id}`);

  for (const plan of ['STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_ANNUAL'] as const) {
    const priceId = process.env[plan]?.trim();
    if (!priceId) continue;
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) {
      console.log(`❌ ${plan} (${priceId}) is not active in Stripe`);
      ok = false;
    } else {
      console.log(`✓  ${plan} → ${price.currency.toUpperCase()} ${(price.unit_amount ?? 0) / 100}/${price.recurring?.interval ?? 'once'}`);
    }
  }
}

verifyStripeConnectivity()
  .then(() => {
    console.log('\nManual checks before flipping live:');
    console.log('  1. Stripe webhook endpoint points to https://<your-domain>/api/stripe/webhook');
    console.log('  2. Webhook listens for checkout.session.completed + customer.subscription.*');
    console.log('  3. Customer portal enabled (Settings → Billing → Customer portal)');
    console.log('  4. Test checkout → Settings shows Pro → Manage billing opens portal');
    console.log('  5. Cancel in portal returns user to free tier limits');

    if (!ok) {
      console.log('\n⚠ Fix the items above, then run again.');
      process.exit(1);
    }

    console.log('\n✅ Stripe env looks ready for', mode, 'mode.');
  })
  .catch((error) => {
    console.error('\n❌ Stripe API check failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
