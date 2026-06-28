import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeCreateStream } from '@/lib/ai/stream-agent';
import { DECK_SYSTEM_PROMPT } from '@/lib/ai/generation-prompts';
import { CLAUDE_MODELS } from '@/lib/ai/claude';
import { SAMPLE_VALID_DECK, validateDeckFormat } from '@/lib/ai/deck-format';

const mockStreamLongForm = vi.fn();

vi.mock('@/lib/ai/claude', () => ({
  CLAUDE_MODELS: {
    playbook: 'claude-opus-4-8',
    memo: 'claude-opus-4-8',
    strategy: 'claude-opus-4-8',
    brief: 'claude-opus-4-8',
    deck: 'claude-opus-4-8',
  },
  streamLongForm: (...args: unknown[]) => mockStreamLongForm(...args),
}));

function createMockSupabase() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn(() => ({ insert })),
    _insert: insert,
  } as unknown as SupabaseClient & { _insert: ReturnType<typeof vi.fn> };
}

const projectContext = {
  chunks: [
    {
      file_name: 'Q3-exec-sync-notes.md',
      source_type: 'meeting',
      text: 'Board aligned on west region expansion. Vendor consolidation is top priority. Denver and Phoenix approved. Maria Santos owns vendor cutover due July 15. Lisa Park needs ROI model before June 28 exec sync. Q3 revenue up 12%.',
    },
    {
      file_name: 'sample-slide.png',
      source_type: 'deck',
      text: 'NO_TEXT_FOUND',
    },
  ],
  criticalItems: [],
  timelineEvents: [],
  projectSummary: 'Acme Corp Q3 business review — expansion and vendor consolidation focus.',
};

describe('deck creation integration', () => {
  beforeEach(() => {
    mockStreamLongForm.mockReset();
    mockStreamLongForm.mockImplementation(
      async (_system: string, _user: string, onToken: (t: string) => void) => {
        for (const ch of SAMPLE_VALID_DECK) onToken(ch);
        return SAMPLE_VALID_DECK;
      }
    );
  });

  it('creates a deck artifact via executeCreateStream with Claude Opus', async () => {
    const supabase = createMockSupabase();
    const tokens: string[] = [];
    const statuses: string[] = [];

    const response = await executeCreateStream({
      action: 'deck',
      message: 'create a deck for me from this meeting',
      context: projectContext,
      project: {
        id: 'proj-acme-q3',
        client_name: 'Acme Corp',
        project_name: 'Q3 Business Review',
      },
      supabase,
      onStatus: (m) => statuses.push(m),
      onToken: (t) => tokens.push(t),
    });

    expect(response.model).toBe('claude');
    expect(response.artifact).toBeDefined();
    expect(response.artifact?.type).toBe('deck');
    expect(response.artifact?.title).toBe('Presentation Deck for Acme Corp');
    expect(response.actions_taken).toContain('Generated presentation deck');

    const format = validateDeckFormat(response.artifact!.content);
    expect(format.valid).toBe(true);
    expect(format.slideCount).toBeGreaterThanOrEqual(6);

    expect(tokens.join('')).toBe(SAMPLE_VALID_DECK);
    expect(statuses).toContain('Creating with Claude...');
  });

  it('calls Claude with the executive deck system prompt and filters test files', async () => {
    const supabase = createMockSupabase();

    await executeCreateStream({
      action: 'deck',
      message: 'make me a visual deck for Q3',
      instructions: 'Focus on board decisions',
      context: projectContext,
      project: {
        id: 'proj-acme-q3',
        client_name: 'Acme Corp',
        project_name: 'Q3 Business Review',
      },
      supabase,
      onStatus: () => {},
      onToken: () => {},
    });

    expect(mockStreamLongForm).toHaveBeenCalledOnce();
    const [system, user, onToken, model] = mockStreamLongForm.mock.calls[0];
    expect(system).toBe(DECK_SYSTEM_PROMPT);
    expect(user).toContain('Acme Corp');
    expect(user).toContain('Q3 Business Review');
    expect(user).toContain('Q3-exec-sync-notes.md');
    expect(user).not.toContain('sample-slide.png');
    expect(user).toContain('Focus on board decisions');
    expect(model).toBe(CLAUDE_MODELS.deck);
    expect(typeof onToken).toBe('function');
  });

  it('persists the deck to generated_documents', async () => {
    const supabase = createMockSupabase();

    await executeCreateStream({
      action: 'deck',
      message: 'create a deck',
      context: projectContext,
      project: {
        id: 'proj-acme-q3',
        client_name: 'Acme Corp',
        project_name: 'Q3 Business Review',
      },
      supabase,
      onStatus: () => {},
      onToken: () => {},
    });

    expect(supabase.from).toHaveBeenCalledWith('generated_documents');
    const insert = (supabase as ReturnType<typeof createMockSupabase>)._insert;
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-acme-q3',
        type: 'memo',
        title: 'Presentation Deck for Acme Corp',
        metadata: expect.objectContaining({ doc_kind: 'deck', source: 'chat' }),
      })
    );

    const savedContent = insert.mock.calls[0][0].content as string;
    expect(validateDeckFormat(savedContent).valid).toBe(true);
  });

  it('returns a helpful message when no substantive materials exist', async () => {
    const supabase = createMockSupabase();
    const tokens: string[] = [];

    const response = await executeCreateStream({
      action: 'deck',
      message: 'create a deck',
      context: {
        chunks: [{ file_name: 'sample-slide.png', text: 'NO_TEXT_FOUND' }],
        criticalItems: [],
        timelineEvents: [],
        projectSummary: null,
      },
      project: {
        id: 'proj-empty',
        client_name: 'Acme Corp',
        project_name: 'Empty',
      },
      supabase,
      onStatus: () => {},
      onToken: (t) => tokens.push(t),
    });

    expect(response.confidence).toBe('low');
    expect(response.artifact).toBeUndefined();
    expect(tokens.join('')).toContain('Upload');
    expect(mockStreamLongForm).not.toHaveBeenCalled();
  });
});

describe('isCreateAction routing', () => {
  it('treats deck as a create action', async () => {
    const { isCreateAction } = await import('@/lib/ai/stream-agent');
    expect(isCreateAction('deck')).toBe(true);
    expect(isCreateAction('answer')).toBe(false);
  });
});
