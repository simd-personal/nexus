import { describe, expect, it } from 'vitest';
import { resolveEngine } from '@/lib/ai/stream-agent';

describe('model preference routing', () => {
  it('auto routes Q&A to ChatGPT and creation to Claude', () => {
    expect(resolveEngine('auto', 'answer')).toBe('gpt');
    expect(resolveEngine('auto', 'create')).toBe('claude');
  });

  it('defaults to auto behavior when no preference is set', () => {
    expect(resolveEngine(undefined, 'answer')).toBe('gpt');
    expect(resolveEngine(undefined, 'create')).toBe('claude');
  });

  it('forces ChatGPT for every task when selected', () => {
    expect(resolveEngine('gpt', 'answer')).toBe('gpt');
    expect(resolveEngine('gpt', 'create')).toBe('gpt');
  });

  it('forces Claude for every task when selected', () => {
    expect(resolveEngine('claude', 'answer')).toBe('claude');
    expect(resolveEngine('claude', 'create')).toBe('claude');
  });
});
