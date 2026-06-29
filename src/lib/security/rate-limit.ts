import { createServiceClient } from '@/lib/supabase/admin';

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
}

export interface RateLimitOptions {
  /** Stable identity for the bucket, e.g. `chat:user:<id>` or `ip:1.2.3.4`. */
  key: string;
  /** Max requests permitted within the window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
}

/**
 * Fixed-window rate limiter backed by Postgres (Supabase). Atomic per call via
 * the `check_rate_limit` RPC. Written behind this small interface so the backing
 * store (e.g. Upstash Redis) can be swapped without touching call sites.
 *
 * Fails open: if the datastore is unreachable we allow the request rather than
 * locking real users out of the product.
 */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, max, windowSec } = options;

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSec,
    });

    if (error || !data) {
      console.warn('[rate-limit] RPC failed, failing open:', error?.message);
      return { allowed: true, count: 0, limit: max, retryAfter: 0 };
    }

    const result = data as {
      allowed: boolean;
      count: number;
      limit: number;
      retry_after: number;
    };

    return {
      allowed: result.allowed,
      count: result.count,
      limit: result.limit,
      retryAfter: result.retry_after,
    };
  } catch (err) {
    console.warn('[rate-limit] threw, failing open:', err);
    return { allowed: true, count: 0, limit: max, retryAfter: 0 };
  }
}

/**
 * Cost tiers for the AI endpoints. Heavier generations get tighter limits.
 * `perMinute` guards burst spam; `perHour` guards sustained farming.
 */
export type AiCost = 'chat' | 'search' | 'generate';

interface CostLimits {
  perMinute: number;
  perHour: number;
}

const FREE_LIMITS: Record<AiCost, CostLimits> = {
  search: { perMinute: 20, perHour: 150 },
  chat: { perMinute: 15, perHour: 120 },
  generate: { perMinute: 6, perHour: 40 },
};

// Pro users get materially higher ceilings — these still stop runaway scripts.
const PRO_LIMITS: Record<AiCost, CostLimits> = {
  search: { perMinute: 60, perHour: 600 },
  chat: { perMinute: 45, perHour: 500 },
  generate: { perMinute: 20, perHour: 150 },
};

export function limitsForCost(cost: AiCost, isPro: boolean): CostLimits {
  return (isPro ? PRO_LIMITS : FREE_LIMITS)[cost];
}
