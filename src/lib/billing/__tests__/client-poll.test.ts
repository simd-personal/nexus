import { describe, expect, it, vi } from 'vitest';
import { pollBillingUntilPro } from '@/lib/billing/client-poll';

describe('pollBillingUntilPro', () => {
  it('returns true once Pro with Stripe subscription is detected', async () => {
    const fetchStatus = vi
      .fn()
      .mockResolvedValueOnce({ is_pro: false, has_stripe_subscription: false })
      .mockResolvedValueOnce({ is_pro: true, has_stripe_subscription: true });

    const result = await pollBillingUntilPro(fetchStatus, {
      maxAttempts: 5,
      intervalMs: 1,
      sleep: async () => {},
    });

    expect(result).toBe(true);
    expect(fetchStatus).toHaveBeenCalledTimes(2);
  });

  it('returns false after max attempts', async () => {
    const fetchStatus = vi.fn().mockResolvedValue({
      is_pro: false,
      has_stripe_subscription: false,
    });

    const result = await pollBillingUntilPro(fetchStatus, {
      maxAttempts: 3,
      intervalMs: 1,
      sleep: async () => {},
    });

    expect(result).toBe(false);
    expect(fetchStatus).toHaveBeenCalledTimes(3);
  });
});
