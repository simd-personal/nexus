import { hasActiveSubscription } from '@/lib/billing/plans';

export const PREMIUM_TEST_ACCOUNTS = [
  { email: 'sim@test.com', fullName: 'Sim Demo', password: 'admin1234' },
  { email: 'taegh@test.com', fullName: 'Taegh', password: 'admin1234' },
] as const;

const PREMIUM_TEST_EMAILS = new Set(
  PREMIUM_TEST_ACCOUNTS.map((account) => account.email.toLowerCase())
);

/** Shared demo / QA accounts that receive Pro limits outside production. */
export function isPremiumTestEmail(email: string | null | undefined): boolean {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PREMIUM_TEST_ACCOUNTS !== 'true') {
    return false;
  }
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
