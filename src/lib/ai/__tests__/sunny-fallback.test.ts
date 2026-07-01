import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectCriticalItems,
  extractActionItems,
  extractEntities,
  summarizeContent,
} from '@/lib/ai/sunny';

const mockStructuredExtraction = vi.fn();
const mockChatCompletion = vi.fn();
const mockGenerateStructured = vi.fn();
const mockGenerateLongForm = vi.fn();

vi.mock('@/lib/ai/openai', () => ({
  OPENAI_MODELS: {
    extraction: 'gpt-5.5',
    summary: 'gpt-5.5',
    criticalDetection: 'gpt-5.5',
    chat: 'gpt-5.5',
  },
  structuredExtraction: (...args: unknown[]) => mockStructuredExtraction(...args),
  chatCompletion: (...args: unknown[]) => mockChatCompletion(...args),
}));

vi.mock('@/lib/ai/claude', () => ({
  CLAUDE_MODELS: { strategy: 'claude-opus-4-8', brief: 'claude-opus-4-8' },
  generateStructured: (...args: unknown[]) => mockGenerateStructured(...args),
  generateLongForm: (...args: unknown[]) => mockGenerateLongForm(...args),
}));

const quota = () => new Error('429 You exceeded your current quota, please check your plan');
const nonQuota = () => new Error('500 Internal server error');

/** Drives the retry backoff timers to completion for a pending call. */
async function resolveWithTimers<T>(promise: Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    await vi.runAllTimersAsync();
    return await promise;
  } finally {
    vi.useRealTimers();
  }
}

beforeEach(() => {
  mockStructuredExtraction.mockReset();
  mockChatCompletion.mockReset();
  mockGenerateStructured.mockReset();
  mockGenerateLongForm.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractEntities fallback', () => {
  it('uses OpenAI on success and does not touch Claude', async () => {
    mockStructuredExtraction.mockResolvedValue({ entities: [{ type: 'person', name: 'Sim' }] });

    const result = await extractEntities('text', 'notes.md');

    expect(result).toEqual([{ type: 'person', name: 'Sim' }]);
    expect(mockStructuredExtraction).toHaveBeenCalledOnce();
    expect(mockGenerateStructured).not.toHaveBeenCalled();
  });

  it('retries then falls back to Claude on quota errors', async () => {
    mockStructuredExtraction.mockRejectedValue(quota());
    mockGenerateStructured.mockResolvedValue({ entities: [{ type: 'facility', name: 'Denver' }] });

    const result = await resolveWithTimers(extractEntities('text', 'notes.md'));

    expect(result).toEqual([{ type: 'facility', name: 'Denver' }]);
    expect(mockStructuredExtraction).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(mockGenerateStructured).toHaveBeenCalledOnce();
  });

  it('recovers on a retry without ever falling back', async () => {
    mockStructuredExtraction
      .mockRejectedValueOnce(quota())
      .mockResolvedValue({ entities: [{ type: 'topic', name: 'Q3' }] });

    const result = await resolveWithTimers(extractEntities('text', 'notes.md'));

    expect(result).toEqual([{ type: 'topic', name: 'Q3' }]);
    expect(mockStructuredExtraction).toHaveBeenCalledTimes(2);
    expect(mockGenerateStructured).not.toHaveBeenCalled();
  });

  it('rethrows non-quota errors without falling back', async () => {
    mockStructuredExtraction.mockRejectedValue(nonQuota());

    await expect(extractEntities('text', 'notes.md')).rejects.toThrow('500');
    expect(mockStructuredExtraction).toHaveBeenCalledOnce();
    expect(mockGenerateStructured).not.toHaveBeenCalled();
  });
});

describe('summarizeContent fallback', () => {
  it('falls back to Claude long-form generation on quota errors', async () => {
    mockChatCompletion.mockRejectedValue(quota());
    mockGenerateLongForm.mockResolvedValue('Denver expansion approved.');

    const result = await resolveWithTimers(summarizeContent('board notes', 'notes.md'));

    expect(result).toContain('Denver');
    expect(mockChatCompletion).toHaveBeenCalledTimes(3);
    expect(mockGenerateLongForm).toHaveBeenCalledOnce();
  });
});

describe('detectCriticalItems fallback', () => {
  it('falls back to Claude structured generation on quota errors', async () => {
    mockStructuredExtraction.mockRejectedValue(quota());
    mockGenerateStructured.mockResolvedValue({
      items: [
        {
          title: 'Timeline risk',
          summary: 'Cutover slipping',
          severity: 'high',
          category: 'risk',
          sunny_reasoning: 'Dates conflict',
        },
      ],
    });

    const result = await resolveWithTimers(detectCriticalItems('new', 'existing', 'notes.md'));

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Timeline risk');
    expect(mockStructuredExtraction).toHaveBeenCalledTimes(3);
    expect(mockGenerateStructured).toHaveBeenCalledOnce();
  });
});

describe('extractActionItems fallback', () => {
  it('falls back to Claude and normalizes the result on quota errors', async () => {
    mockStructuredExtraction.mockRejectedValue(quota());
    mockGenerateStructured.mockResolvedValue({
      action_items: [{ title: 'Send Epic timeline', owner: 'Sim', confidence: 'high' }],
    });

    const result = await resolveWithTimers(extractActionItems('meeting text', 'notes.md'));

    expect(result).toEqual([
      expect.objectContaining({ title: 'Send Epic timeline', owner: 'Sim', confidence: 'high' }),
    ]);
    expect(mockStructuredExtraction).toHaveBeenCalledTimes(3);
    expect(mockGenerateStructured).toHaveBeenCalledOnce();
  });
});
