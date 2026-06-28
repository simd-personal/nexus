import { config } from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

config({ path: resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
});

async function findOrCreateProduct(): Promise<Stripe.Product> {
  const existing = await stripe.products.search({
    query: "active:'true' AND metadata['upperdeck_product']:'true'",
    limit: 1,
  });

  if (existing.data[0]) return existing.data[0];

  return stripe.products.create({
    name: 'UpperDeck Pro',
    description: 'Unlimited client projects and Sunny AI for consultants and operators.',
    metadata: { upperdeck_product: 'true' },
  });
}

async function findOrCreatePrice(input: {
  productId: string;
  lookupKey: string;
  unitAmount: number;
  interval: 'month' | 'year';
}): Promise<Stripe.Price> {
  const existing = await stripe.prices.list({
    lookup_keys: [input.lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data[0]) return existing.data[0];

  return stripe.prices.create({
    product: input.productId,
    currency: 'usd',
    unit_amount: input.unitAmount,
    recurring: { interval: input.interval },
    lookup_key: input.lookupKey,
    transfer_lookup_key: true,
  });
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  const product = await findOrCreateProduct();

  const monthly = await findOrCreatePrice({
    productId: product.id,
    lookupKey: 'upperdeck_pro_monthly',
    unitAmount: 3900,
    interval: 'month',
  });

  const annual = await findOrCreatePrice({
    productId: product.id,
    lookupKey: 'upperdeck_pro_annual',
    unitAmount: 34800,
    interval: 'year',
  });

  console.log('\nUpperDeck Stripe products ready (test mode):\n');
  console.log(`STRIPE_PRICE_PRO_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_PRO_ANNUAL=${annual.id}`);
  console.log('\nAdd these to .env.local and Vercel. For local webhooks run:');
  console.log('  stripe listen --forward-to localhost:3000/api/stripe/webhook\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
