import { describe, expect, it, vi } from 'vitest';
import { backoffDelay, withOpenAIFallback, withRetry } from '@/lib/ai/fallback';

const quotaError = () => new Error('429 You exceeded your current quota, please check your plan');
const otherError = () => new Error('500 Internal server error');
const noSleep = async () => {};

describe('backoffDelay', () => {
  it('grows exponentially and caps at maxMs (full random)', () => {
    const full = () => 1;
    expect(backoffDelay(0, 1000, 8000, full)).toBe(1000);
    expect(backoffDelay(1, 1000, 8000, full)).toBe(2000);
    expect(backoffDelay(2, 1000, 8000, full)).toBe(4000);
    expect(backoffDelay(3, 1000, 8000, full)).toBe(8000);
    expect(backoffDelay(10, 1000, 8000, full)).toBe(8000);
  });

  it('applies jitter via the random source', () => {
    expect(backoffDelay(2, 1000, 8000, () => 0)).toBe(0);
    expect(backoffDelay(2, 1000, 8000, () => 0.5)).toBe(2000);
  });
});

describe('withRetry', () => {
  it('returns immediately when the first attempt succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const sleep = vi.fn(noSleep);

    await expect(withRetry(fn, { retries: 2, sleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries retryable errors then succeeds', async () => {
    const fn = vi.fn().mockRejectedValueOnce(quotaError()).mockResolvedValue('recovered');
    const sleep = vi.fn(noSleep);

    await expect(withRetry(fn, { retries: 2, sleep, random: () => 0 })).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries and throws the last error', async () => {
    const fn = vi.fn().mockRejectedValue(quotaError());
    const sleep = vi.fn(noSleep);
    const onRetry = vi.fn();

    await expect(withRetry(fn, { retries: 2, sleep, onRetry, random: () => 0 })).rejects.toThrow('429');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(otherError());
    const sleep = vi.fn(noSleep);

    await expect(withRetry(fn, { retries: 3, sleep })).rejects.toThrow('500');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('honors a custom isRetryable predicate', async () => {
    const fn = vi.fn().mockRejectedValue(otherError());
    const sleep = vi.fn(noSleep);

    await expect(
      withRetry(fn, { retries: 2, sleep, random: () => 0, isRetryable: () => true })
    ).rejects.toThrow('500');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('defaults to zero retries', async () => {
    const fn = vi.fn().mockRejectedValue(quotaError());
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('429');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('withOpenAIFallback', () => {
  it('returns the primary result without calling fallback on success', async () => {
    const primary = vi.fn().mockResolvedValue('primary');
    const fallback = vi.fn().mockResolvedValue('fallback');

    await expect(withOpenAIFallback({ primary, fallback })).resolves.toBe('primary');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('falls back to Claude on OpenAI quota errors', async () => {
    const primary = vi.fn().mockRejectedValue(quotaError());
    const fallback = vi.fn().mockResolvedValue('fallback');
    const logger = vi.fn();

    await expect(withOpenAIFallback({ primary, fallback, logger, label: 'Test' })).resolves.toBe('fallback');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('Test'));
  });

  it('rethrows non-quota errors without falling back', async () => {
    const primary = vi.fn().mockRejectedValue(otherError());
    const fallback = vi.fn().mockResolvedValue('fallback');

    await expect(withOpenAIFallback({ primary, fallback })).rejects.toThrow('500');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('retries the primary before falling back when a retry policy is set', async () => {
    const primary = vi.fn().mockRejectedValue(quotaError());
    const fallback = vi.fn().mockResolvedValue('fallback');

    await expect(
      withOpenAIFallback({
        primary,
        fallback,
        logger: () => {},
        retry: { retries: 2, sleep: noSleep, random: () => 0 },
      })
    ).resolves.toBe('fallback');
    expect(primary).toHaveBeenCalledTimes(3);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('honors a custom shouldFallback predicate', async () => {
    const primary = vi.fn().mockRejectedValue(otherError());
    const fallback = vi.fn().mockResolvedValue('fallback');

    await expect(
      withOpenAIFallback({ primary, fallback, logger: () => {}, shouldFallback: () => true })
    ).resolves.toBe('fallback');
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
