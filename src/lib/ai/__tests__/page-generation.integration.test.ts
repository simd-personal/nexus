import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatBriefAsProse,
  generatePageBrief,
  generatePageFollowUpEmail,
  generatePagePlaybook,
  streamPageBrief,
  streamPagePlaybook,
} from '@/lib/ai/page-generation';

const mockStructuredExtraction = vi.fn();
const mockGenerateLongForm = vi.fn();
const mockStreamLongForm = vi.fn();
const mockStreamClaudeLongForm = vi.fn();

vi.mock('@/lib/ai/openai', () => ({
  OPENAI_MODELS: {
    generation: 'gpt-5.5',
    generationHigh: 'gpt-5.5',
    summary: 'gpt-5.5',
  },
  chatCompletion: vi.fn(),
  structuredExtraction: (...args: unknown[]) => mockStructuredExtraction(...args),
  generateLongForm: (...args: unknown[]) => mockGenerateLongForm(...args),
  streamLongForm: (...args: unknown[]) => mockStreamLongForm(...args),
}));

vi.mock('@/lib/ai/claude', () => ({
  CLAUDE_MODELS: {
    brief: 'claude-opus-4-8',
    playbook: 'claude-opus-4-8',
  },
  streamLongForm: (...args: unknown[]) => mockStreamClaudeLongForm(...args),
}));

const context = {
  chunks: [
    {
      file_name: 'notes.md',
      source_type: 'note',
      text: 'Denver expansion approved. Sarah owns budget follow up by Friday.',
    },
  ],
  criticalItems: [],
  timelineEvents: [],
  projectSummary: 'Acme Q3 review focused on west region expansion.',
};

describe('page generation (GPT, outside chat)', () => {
  beforeEach(() => {
    mockStructuredExtraction.mockReset();
    mockGenerateLongForm.mockReset();
    mockStreamLongForm.mockReset();
    mockStreamClaudeLongForm.mockReset();
  });

  it('generatePageBrief uses GPT and returns sanitized prose fields', async () => {
    mockStructuredExtraction.mockResolvedValue({
      executive_summary: '**Denver** approved — timeline set',
      what_changed_recently: 'Board aligned on expansion',
      critical_items: 'None flagged',
      client_concerns: 'Not enough evidence in the uploaded materials.',
      risks: 'Vendor timeline',
      opportunities: 'West region growth',
      people_mentioned: 'Sarah',
      facilities_mentioned: 'Denver',
      open_action_items: 'Budget follow up',
      contradictions: 'None',
      recommended_next_steps: 'Confirm vendor plan',
    });

    const brief = await generatePageBrief(context);

    expect(mockStructuredExtraction).toHaveBeenCalledWith(
      expect.stringContaining('executive brief'),
      expect.any(String),
      'gpt-5.5',
      { reasoningEffort: 'high' }
    );
    expect(brief.executive_summary).not.toContain('*');
    expect(brief.executive_summary).not.toContain('—');
    expect(brief.citations).toHaveLength(1);
  });

  it('formatBriefAsProse renders section labels without markdown', () => {
    const prose = formatBriefAsProse({
      executive_summary: 'Denver approved.',
      what_changed_recently: 'Board aligned.',
      critical_items: 'None',
      client_concerns: 'None',
      risks: 'Timeline',
      opportunities: 'Growth',
      people_mentioned: 'Sarah',
      facilities_mentioned: 'Denver',
      open_action_items: 'Budget',
      contradictions: 'None',
      recommended_next_steps: 'Follow up',
    });

    expect(prose).toContain('Executive Summary');
    expect(prose).not.toContain('##');
    expect(prose).toContain('Denver approved.');
  });

  it('generatePagePlaybook sanitizes long form output', async () => {
    mockGenerateLongForm.mockResolvedValue(
      '## Overview\n\n- **Client** wants expansion — Denver approved'
    );

    const content = await generatePagePlaybook('Q3 Review', 'Acme Corp', context);

    expect(mockGenerateLongForm).toHaveBeenCalledWith(
      expect.stringContaining('operating playbook'),
      expect.stringContaining('Acme Corp'),
      'gpt-5.5'
    );
    expect(content).not.toContain('*');
    expect(content).not.toContain('-');
  });

  it('generatePageFollowUpEmail uses GPT generation model', async () => {
    mockGenerateLongForm.mockResolvedValue('Hi team, following up on our discussion.');

    const email = await generatePageFollowUpEmail('Q3 Review', 'Acme Corp', context, 'detailed');

    expect(email).toContain('following up');
    expect(mockGenerateLongForm).toHaveBeenCalledWith(
      expect.stringContaining('follow up email'),
      expect.any(String),
      'gpt-5.5'
    );
  });
});

describe('page generation streaming (model preference)', () => {
  beforeEach(() => {
    mockStreamLongForm.mockReset();
    mockStreamClaudeLongForm.mockReset();
    mockStreamLongForm.mockResolvedValue('GPT brief content');
    mockStreamClaudeLongForm.mockResolvedValue('Claude brief content');
  });

  it('streamPageBrief uses Claude when preference is auto', async () => {
    const result = await streamPageBrief(context, 'Summarize the project', [], vi.fn(), 'auto');

    expect(mockStreamClaudeLongForm).toHaveBeenCalled();
    expect(mockStreamLongForm).not.toHaveBeenCalled();
    expect(result.model).toBe('claude');
    expect(result.content).toContain('Claude brief content');
  });

  it('streamPageBrief uses GPT when preference is gpt', async () => {
    const result = await streamPageBrief(context, 'Summarize the project', [], vi.fn(), 'gpt');

    expect(mockStreamLongForm).toHaveBeenCalledWith(
      expect.stringContaining('executive brief'),
      expect.any(String),
      expect.any(Function),
      'gpt-5.5',
      { reasoningEffort: 'high' }
    );
    expect(mockStreamClaudeLongForm).not.toHaveBeenCalled();
    expect(result.model).toBe('gpt');
  });

  it('streamPagePlaybook respects claude preference', async () => {
    const result = await streamPagePlaybook(
      'Q3 Review',
      'Acme Corp',
      context,
      'Build a playbook',
      [],
      vi.fn(),
      'claude'
    );

    expect(mockStreamClaudeLongForm).toHaveBeenCalledWith(
      expect.stringContaining('operating playbook'),
      expect.any(String),
      expect.any(Function),
      'claude-opus-4-8'
    );
    expect(result.model).toBe('claude');
  });
});
