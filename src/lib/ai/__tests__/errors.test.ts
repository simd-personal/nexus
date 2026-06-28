import { describe, expect, it } from 'vitest';
import { formatStreamError, isOpenAIUnavailable } from '@/lib/ai/errors';

describe('isOpenAIUnavailable', () => {
  it('detects quota and rate-limit errors', () => {
    expect(
      isOpenAIUnavailable(new Error('429 You exceeded your current quota, please check your plan'))
    ).toBe(true);
    expect(isOpenAIUnavailable(new Error('Rate limit exceeded'))).toBe(true);
    expect(isOpenAIUnavailable(new Error('insufficient_quota'))).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isOpenAIUnavailable(new Error('Network timeout'))).toBe(false);
    expect(isOpenAIUnavailable('429')).toBe(false);
  });
});

describe('formatStreamError', () => {
  it('returns a friendly message for OpenAI quota errors', () => {
    expect(
      formatStreamError(new Error('429 You exceeded your current quota'))
    ).toContain('temporarily unavailable');
  });

  it('hides raw API status codes', () => {
    expect(formatStreamError(new Error('500 Internal server error'))).toContain(
      'Something went wrong'
    );
  });
});
