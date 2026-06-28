import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

describe('extractTextFromImage OpenAI call', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Slide headline: Revenue up 12 percent' } }],
    });
    vi.resetModules();
  });

  it('uses max_completion_tokens for GPT-5.5 vision', async () => {
    const { extractTextFromImage } = await import('@/lib/ai/openai');
    const text = await extractTextFromImage(Buffer.from('png-bytes'), 'image/png');

    expect(text).toContain('Revenue up 12 percent');
    expect(mockCreate).toHaveBeenCalledOnce();
    const params = mockCreate.mock.calls[0][0];
    expect(params.model).toBe('gpt-5.5');
    expect(params.max_completion_tokens).toBe(4096);
    expect(params.max_tokens).toBeUndefined();
  });
});
