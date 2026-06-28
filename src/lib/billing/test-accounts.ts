import { hasActiveSubscription } from '@/lib/billing/plans';

/** Shared demo / QA accounts that always receive Pro limits in non-production and production. */
const PREMIUM_TEST_EMAILS = new Set(['sim@test.com']);

export function isPremiumTestEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PREMIUM_TEST_EMAILS.has(email.toLowerCase());
}

export function hasProAccess(options: {
  plan?: string | null;
  subscriptionStatus?: string | null;
  accountType?: string | null;
  email?: string | null;
}): boolean {
  if (options.accountType === 'enterprise') return true;
  if (hasActiveSubscription(options.plan, options.subscriptionStatus)) return true;
  if (isPremiumTestEmail(options.email)) return true;
  return false;
}
