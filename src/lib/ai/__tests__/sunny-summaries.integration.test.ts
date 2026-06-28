import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enrichProjectSetup,
  generateSunnyUpdate,
  summarizeContent,
} from '@/lib/ai/sunny';

const mockChatCompletion = vi.fn();
const mockStructuredExtraction = vi.fn();

vi.mock('@/lib/ai/openai', () => ({
  OPENAI_MODELS: {
    summary: 'gpt-5.5',
    criticalDetection: 'gpt-5.5',
    extraction: 'gpt-5.5',
    chat: 'gpt-5.5',
  },
  chatCompletion: (...args: unknown[]) => mockChatCompletion(...args),
  structuredExtraction: (...args: unknown[]) => mockStructuredExtraction(...args),
}));

describe('Sunny summary generation (GPT)', () => {
  beforeEach(() => {
    mockChatCompletion.mockReset();
    mockStructuredExtraction.mockReset();
  });

  it('summarizeContent returns sanitized plain prose', async () => {
    mockChatCompletion.mockResolvedValue(
      '## Update\n- **Denver** approved — timeline confirmed'
    );

    const summary = await summarizeContent('Board notes...', 'notes.md');

    expect(mockChatCompletion).toHaveBeenCalledOnce();
    const systemPrompt = mockChatCompletion.mock.calls[0][0] as string;
    expect(systemPrompt).toContain('Never use asterisks');
    expect(summary).not.toContain('*');
    expect(summary).not.toContain('-');
    expect(summary).toContain('Denver');
  });

  it('generateSunnyUpdate sanitizes all text fields', async () => {
    mockStructuredExtraction.mockResolvedValue({
      title: 'Critical update',
      summary: '- **Vendor** risk identified',
      why_it_matters: 'Timeline — client expects answer',
      suggested_action: 'Review the **contract**',
    });

    const update = await generateSunnyUpdate('Acme Q3', 'New conflict found');

    expect(update.summary).not.toContain('*');
    expect(update.why_it_matters).not.toContain('—');
    expect(update.suggested_action).not.toContain('*');
    expect(mockStructuredExtraction).toHaveBeenCalledWith(
      expect.stringContaining('Never use asterisks'),
      expect.stringContaining('Acme Q3'),
      'gpt-5.5'
    );
  });

  it('enrichProjectSetup uses GPT and sanitizes initial summary', async () => {
    mockStructuredExtraction.mockResolvedValue({
      description: 'Q3 business review for Acme Corp.',
      initial_summary: '**Track** Denver expansion — vendor timeline',
    });

    const result = await enrichProjectSetup({
      clientName: 'Acme Corp',
      projectName: 'Q3 Review',
      description: 'Quarterly review',
    });

    expect(result.initial_summary).not.toContain('*');
    expect(result.initial_summary).not.toContain('—');
    expect(mockStructuredExtraction).toHaveBeenCalledWith(
      expect.stringContaining('initial_summary'),
      expect.stringContaining('Acme Corp'),
      'gpt-5.5'
    );
  });
});
