import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isCreateAction,
  resolveEngine,
  streamSearchAnswer,
} from '@/lib/ai/stream-agent';

const mockStreamChat = vi.fn();
const mockStreamLongForm = vi.fn();

vi.mock('@/lib/ai/openai', () => ({
  OPENAI_MODELS: { chat: 'gpt-5.5' },
  streamChatCompletion: (...args: unknown[]) => mockStreamChat(...args),
}));

vi.mock('@/lib/ai/claude', () => ({
  CLAUDE_MODELS: { brief: 'claude-opus-4-8' },
  streamLongForm: (...args: unknown[]) => mockStreamLongForm(...args),
}));

const baseContext = {
  chunks: [
    {
      file_name: 'notes.md',
      source_type: 'note',
      text: 'Denver expansion was approved by the board after the Q3 executive review and budget sign-off.',
    },
  ],
  criticalItems: [],
  timelineEvents: [],
  projectSummary: 'Acme Q3 review in progress with leadership aligned on the Denver expansion timeline.',
};

const baseRetrieved = [
  {
    id: 'chunk-1',
    project_id: 'project-1',
    text: 'Denver expansion was approved by the board after the Q3 executive review and budget sign-off.',
    metadata: {},
    match_reason: 'Semantic match',
    file_name: 'notes.md',
    similarity: 0.82,
  },
];

describe('streamSearchAnswer', () => {
  beforeEach(() => {
    mockStreamChat.mockReset();
    mockStreamLongForm.mockReset();
    mockStreamChat.mockImplementation(async (_s: string, _u: string, onToken: (t: string) => void) => {
      onToken('Denver');
      onToken(' approved.');
      return 'Denver approved.';
    });
    mockStreamLongForm.mockImplementation(async (_s: string, _u: string, onToken: (t: string) => void) => {
      onToken('Claude says Denver.');
      return 'Claude says Denver.';
    });
  });

  it('streams GPT answers when engine is gpt', async () => {
    const tokens: string[] = [];
    const result = await streamSearchAnswer(
      'What happened in Denver?',
      baseContext,
      (t) => tokens.push(t),
      { engine: 'gpt', retrieved: baseRetrieved }
    );

    expect(mockStreamChat).toHaveBeenCalledOnce();
    expect(mockStreamLongForm).not.toHaveBeenCalled();
    expect(tokens.join('')).toBe('Denver approved.');
    expect(result.model).toBe('gpt');
    expect(result.citations).toHaveLength(1);
    expect(result.confidence).toBe('high');
  });

  it('streams Claude answers when engine is claude', async () => {
    await streamSearchAnswer('Denver?', baseContext, () => {}, {
      engine: 'claude',
      retrieved: baseRetrieved,
    });
    expect(mockStreamLongForm).toHaveBeenCalledOnce();
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it('returns low confidence when no materials exist', async () => {
    const tokens: string[] = [];
    const result = await streamSearchAnswer(
      'Anything?',
      { chunks: [], criticalItems: [], timelineEvents: [], projectSummary: null },
      (t) => tokens.push(t)
    );

    expect(result.confidence).toBe('low');
    expect(tokens.join('')).toContain('uploaded materials');
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it('falls back to Claude when GPT hits quota errors', async () => {
    mockStreamChat.mockRejectedValueOnce(
      new Error('429 You exceeded your current quota, please check your plan')
    );

    const tokens: string[] = [];
    const result = await streamSearchAnswer(
      'What happened in Denver?',
      baseContext,
      (t) => tokens.push(t),
      { engine: 'gpt', retrieved: baseRetrieved }
    );

    expect(mockStreamChat).toHaveBeenCalledOnce();
    expect(mockStreamLongForm).toHaveBeenCalledOnce();
    expect(tokens.join('')).toBe('Claude says Denver.');
    expect(result.model).toBe('claude');
  });

  it('includes scope instructions in the GPT system prompt', async () => {
    await streamSearchAnswer('Denver?', baseContext, () => {}, {
      engine: 'gpt',
      scopeInstruction: 'Search scope: ONLY Acme project.',
      retrieved: baseRetrieved,
    });

    const systemPrompt = mockStreamChat.mock.calls[0][0] as string;
    expect(systemPrompt).toContain('Search scope: ONLY Acme project.');
  });
});

describe('create action routing', () => {
  it('identifies generation actions', () => {
    expect(isCreateAction('deck')).toBe(true);
    expect(isCreateAction('brief')).toBe(true);
    expect(isCreateAction('answer')).toBe(false);
  });

  it('respects model preference overrides', () => {
    expect(resolveEngine('gpt', 'create')).toBe('gpt');
    expect(resolveEngine('claude', 'answer')).toBe('claude');
    expect(resolveEngine('auto', 'answer')).toBe('gpt');
    expect(resolveEngine('auto', 'create')).toBe('claude');
  });
});
