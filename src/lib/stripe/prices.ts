import type { CheckoutPlanId } from '@/lib/billing/plans';
import { getStripe } from '@/lib/stripe/client';

const LOOKUP_KEYS: Record<CheckoutPlanId, string> = {
  pro: 'upperdeck_pro_monthly',
  'pro-annual': 'upperdeck_pro_annual',
};

const ENV_KEYS: Record<CheckoutPlanId, string> = {
  pro: 'STRIPE_PRICE_PRO_MONTHLY',
  'pro-annual': 'STRIPE_PRICE_PRO_ANNUAL',
};

export async function resolveStripePriceId(plan: CheckoutPlanId): Promise<string> {
  const envKey = ENV_KEYS[plan];
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;

  const stripe = getStripe();
  const lookupKey = LOOKUP_KEYS[plan];
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  const priceId = prices.data[0]?.id;
  if (!priceId) {
    throw new Error(
      `Stripe price not found for ${plan}. Run npm run stripe:setup or set ${envKey} in your environment.`
    );
  }

  return priceId;
}

export function billingPlanFromPriceId(priceId: string | null | undefined): 'pro' | 'pro_annual' | null {
  if (!priceId) return null;

  const monthly = process.env.STRIPE_PRICE_PRO_MONTHLY?.trim();
  const annual = process.env.STRIPE_PRICE_PRO_ANNUAL?.trim();

  if (monthly && priceId === monthly) return 'pro';
  if (annual && priceId === annual) return 'pro_annual';

  return null;
}
