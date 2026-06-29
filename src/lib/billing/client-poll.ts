import type { BillingStatusSnapshot } from '@/lib/billing/billing-status';

export type BillingStatusResponse = BillingStatusSnapshot;

/**
 * Poll billing status after Stripe Checkout success until the webhook updates
 * the profile or we time out (~30s default).
 */
export async function pollBillingUntilPro(
  fetchStatus: () => Promise<BillingStatusResponse>,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {}
): Promise<boolean> {
  const maxAttempts = options.maxAttempts ?? 15;
  const intervalMs = options.intervalMs ?? 2000;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await fetchStatus();
    if (status.is_pro && status.has_stripe_subscription) return true;
    if (attempt < maxAttempts - 1) await sleep(intervalMs);
  }

  return false;
}

export async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  const response = await fetch('/api/billing/status', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load billing status');
  }
  return response.json();
}

export async function openBillingPortal(): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch('/api/stripe/portal', { method: 'POST' });
  const data = await response.json();
  if (!response.ok) {
    return { ok: false, error: data.error ?? 'Could not open billing portal' };
  }
  if (data.url) {
    window.location.href = data.url;
    return { ok: true };
  }
  return { ok: false, error: 'Billing portal URL missing' };
}
