/**
 * Centralized provider failover + retry for AI calls.
 *
 * This is the single place OpenAI→Claude failover and transient-error retry
 * live. Callers describe a primary (OpenAI) call and a Claude fallback; the
 * fallback fires only when {@link isOpenAIUnavailable} recognizes the error
 * (quota / rate limit), matching the pre-existing behavior across the app.
 *
 * Retry is opt-in via `retry`. Streaming and interactive search/chat paths
 * intentionally leave retry off so token emission is never duplicated; only
 * the durable file-processing pipeline enables retry-with-backoff.
 */
import { isOpenAIUnavailable } from '@/lib/ai/errors';

export interface RetryOptions {
  /** Number of retries after the first attempt (default 0 = no retry). */
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Which errors are worth retrying. Defaults to quota/rate-limit errors. */
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (info: { attempt: number; error: unknown; delayMs: number }) => void;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable for tests. */
  random?: () => number;
}

const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 8000;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Full-jitter exponential backoff. */
export function backoffDelay(
  attempt: number,
  baseMs: number,
  maxMs: number,
  random: () => number
): number {
  const capped = Math.min(maxMs, baseMs * 2 ** attempt);
  return Math.round(capped * random());
}

/**
 * Runs `fn`, retrying on retryable errors with exponential backoff. Rethrows
 * the last error once retries are exhausted or the error is not retryable.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = Math.max(0, options.retries ?? 0);
  const baseMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const isRetryable = options.isRetryable ?? isOpenAIUnavailable;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isRetryable(error)) throw error;
      const delayMs = backoffDelay(attempt, baseMs, maxMs, random);
      options.onRetry?.({ attempt: attempt + 1, error, delayMs });
      await sleep(delayMs);
      attempt += 1;
    }
  }
}

export interface FallbackOptions<T> {
  primary: () => Promise<T>;
  fallback: () => Promise<T>;
  /** When true, run `fallback`. Defaults to quota/rate-limit detection. */
  shouldFallback?: (error: unknown) => boolean;
  /** Retry policy applied to `primary` only. Omit for no retry. */
  retry?: RetryOptions;
  label?: string;
  /** Injectable for tests. */
  logger?: (message: string) => void;
}

/**
 * Runs the OpenAI `primary` call (optionally with retry) and falls back to the
 * Claude `fallback` when the error is a recognized OpenAI-unavailable error.
 * Any other error is rethrown unchanged.
 */
export async function withOpenAIFallback<T>(options: FallbackOptions<T>): Promise<T> {
  const shouldFallback = options.shouldFallback ?? isOpenAIUnavailable;
  try {
    return options.retry
      ? await withRetry(options.primary, options.retry)
      : await options.primary();
  } catch (error) {
    if (!shouldFallback(error)) throw error;
    (options.logger ?? console.warn)(
      `[ai] ${options.label ?? 'OpenAI'} unavailable — falling back to Claude`
    );
    return options.fallback();
  }
}

/**
 * Shared retry policy for durable file-processing analysis steps. Short so a
 * transient blip recovers without pushing past the serverless time budget;
 * a sustained outage exhausts quickly and hands off to the Claude fallback.
 */
export const PROCESSING_RETRY: RetryOptions = {
  retries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};
