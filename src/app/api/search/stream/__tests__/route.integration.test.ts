import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockRetrieveForQuery = vi.fn();
const mockGetOrCreateSession = vi.fn();
const mockSaveChatMessage = vi.fn();
const mockCreateEmbedding = vi.fn();
const mockGuardAiRequest = vi.fn();
const mockCheckChatQuota = vi.fn();
const mockGetBillingContext = vi.fn();
const mockStreamSearchAnswer = vi.fn();
const mockClassifyChatIntent = vi.fn();
const mockLoadSessionHistory = vi.fn();
const mockBuildProjectSummary = vi.fn();
const mockEvaluatePreQueryGuard = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(),
  })),
}));

vi.mock('@/lib/search/retrieve', () => ({
  retrieveForQuery: (...args: unknown[]) => mockRetrieveForQuery(...args),
  toSearchContext: vi.fn(() => []),
}));

vi.mock('@/lib/chat/sessions', () => ({
  getOrCreateSession: (...args: unknown[]) => mockGetOrCreateSession(...args),
  saveChatMessage: (...args: unknown[]) => mockSaveChatMessage(...args),
  deleteLastAssistantMessage: vi.fn(),
}));

vi.mock('@/lib/ai/openai', () => ({
  createEmbeddingOrNull: (...args: unknown[]) => mockCreateEmbedding(...args),
}));

vi.mock('@/lib/security/guard', () => ({
  guardAiRequest: (...args: unknown[]) => mockGuardAiRequest(...args),
}));

vi.mock('@/lib/security/query-guard', () => ({
  evaluatePreQueryGuard: (...args: unknown[]) => mockEvaluatePreQueryGuard(...args),
}));

vi.mock('@/lib/billing/limits', () => ({
  checkChatQuota: (...args: unknown[]) => mockCheckChatQuota(...args),
  getBillingContextForUser: (...args: unknown[]) => mockGetBillingContext(...args),
}));

vi.mock('@/lib/ai/stream-agent', () => ({
  streamSearchAnswer: (...args: unknown[]) => mockStreamSearchAnswer(...args),
  classifyChatIntent: (...args: unknown[]) => mockClassifyChatIntent(...args),
  isCreateAction: () => false,
  executeCreateStream: vi.fn(),
  resolveEngine: () => 'auto',
}));

vi.mock('@/lib/chat/memory', () => ({
  loadSessionHistory: (...args: unknown[]) => mockLoadSessionHistory(...args),
  buildHistoryNote: () => '',
}));

vi.mock('@/lib/search/scope', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/search/scope')>();
  return {
    ...actual,
    buildProjectSummary: (...args: unknown[]) => mockBuildProjectSummary(...args),
  };
});

import { POST } from '@/app/api/search/stream/route';

async function readSseEvents(response: Response) {
  const text = await response.text();
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const dataLine = block.split('\n').find((line) => line.startsWith('data: '));
      const eventLine = block.split('\n').find((line) => line.startsWith('event: '));
      return {
        event: eventLine?.replace('event: ', '') ?? '',
        data: dataLine ? JSON.parse(dataLine.replace('data: ', '')) : null,
      };
    });
}

describe('POST /api/search/stream tenant isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-new', email: 'new@example.com' } },
    });
    mockGuardAiRequest.mockResolvedValue(null);
    mockEvaluatePreQueryGuard.mockResolvedValue({ allowed: true, message: '' });
    mockCheckChatQuota.mockResolvedValue({ exceeded: false });
    mockGetBillingContext.mockResolvedValue({ isPro: false });
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockGetOrCreateSession.mockResolvedValue({ id: 'session-1', title: 'PB Hilo' });
    mockSaveChatMessage.mockResolvedValue(undefined);
    mockLoadSessionHistory.mockResolvedValue([]);
    mockClassifyChatIntent.mockResolvedValue({ action: 'answer' });
    mockBuildProjectSummary.mockResolvedValue({ summary: null, labels: [] });
    mockStreamSearchAnswer.mockResolvedValue({
      citations: [],
      confidence: 'low',
      model: 'auto',
    });
  });

  it('streams no foreign project results for a new account with no data', async () => {
    mockRetrieveForQuery.mockResolvedValue([]);

    const res = await POST(
      new NextRequest('http://localhost:3000/api/search/stream', {
        method: 'POST',
        body: JSON.stringify({ query: 'PB Hilo meeting brief' }),
      })
    );

    expect(res.status).toBe(200);
    const events = await readSseEvents(res);
    const resultsEvent = events.find((e) => e.event === 'results');
    expect(resultsEvent?.data?.results ?? []).toEqual([]);
    expect(mockRetrieveForQuery).toHaveBeenCalled();
  });

  it('does not surface another account project ids in streamed results', async () => {
    mockRetrieveForQuery.mockResolvedValue([
      {
        id: 'chunk-own',
        project_id: 'project-own',
        text: 'Own notes',
        metadata: {},
        match_reason: 'Keyword match',
      },
    ]);

    const res = await POST(
      new NextRequest('http://localhost:3000/api/search/stream', {
        method: 'POST',
        body: JSON.stringify({ query: 'my notes' }),
      })
    );

    const events = await readSseEvents(res);
    const resultsEvent = events.find((e) => e.event === 'results');
    const results = resultsEvent?.data?.results ?? [];
    expect(results.every((r: { project_id: string }) => r.project_id === 'project-own')).toBe(
      true
    );
    expect(results.some((r: { project_id: string }) => r.project_id === 'project-foreign')).toBe(
      false
    );
  });
});

describe('POST /api/search/stream multi-project scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mockGuardAiRequest.mockResolvedValue(null);
    mockEvaluatePreQueryGuard.mockResolvedValue({ allowed: true, message: '' });
    mockCheckChatQuota.mockResolvedValue({ exceeded: false });
    mockGetBillingContext.mockResolvedValue({ isPro: true });
    mockCreateEmbedding.mockResolvedValue([0.1, 0.2]);
    mockGetOrCreateSession.mockResolvedValue({ id: 'session-multi', title: 'Scoped search' });
    mockSaveChatMessage.mockResolvedValue(undefined);
    mockLoadSessionHistory.mockResolvedValue([]);
    mockClassifyChatIntent.mockResolvedValue({ action: 'answer' });
    mockBuildProjectSummary.mockResolvedValue({ summary: 'Combined summary', labels: ['Acme · A', 'Beta · B'] });
    mockStreamSearchAnswer.mockResolvedValue({
      citations: [],
      confidence: 'high',
      model: 'auto',
    });
    mockRetrieveForQuery.mockResolvedValue([
      {
        id: 'chunk-a',
        project_id: 'proj-a',
        text: 'Notes from A',
        metadata: {},
        match_reason: 'Keyword match',
        chunk_index: 0,
      },
    ]);
  });

  it('passes project_ids to retrieval and persists scope on the user message', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/search/stream', {
        method: 'POST',
        body: JSON.stringify({
          query: 'staffing concerns',
          project_ids: ['proj-a', 'proj-b'],
          scope_labels: ['Acme · Site rollout', 'Beta · Strategy'],
        }),
      })
    );

    expect(res.status).toBe(200);
    const events = await readSseEvents(res);

    expect(mockRetrieveForQuery).toHaveBeenCalledWith(
      expect.anything(),
      'staffing concerns',
      [0.1, 0.2],
      expect.objectContaining({ projectIds: ['proj-a', 'proj-b'] })
    );

    expect(mockSaveChatMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        role: 'user',
        metadata: {
          scope: {
            project_ids: ['proj-a', 'proj-b'],
            labels: ['Acme · Site rollout', 'Beta · Strategy'],
          },
        },
      })
    );

    expect(events.some((e) => e.event === 'done')).toBe(true);
  });

  it('falls back to legacy project_id when project_ids is empty', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/search/stream', {
        method: 'POST',
        body: JSON.stringify({
          query: 'timeline risks',
          project_id: 'proj-legacy',
        }),
      })
    );

    await readSseEvents(res);

    expect(mockRetrieveForQuery).toHaveBeenCalledWith(
      expect.anything(),
      'timeline risks',
      [0.1, 0.2],
      expect.objectContaining({ projectIds: ['proj-legacy'] })
    );
  });

  it('emits a multi-project status message when several projects are scoped', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/search/stream', {
        method: 'POST',
        body: JSON.stringify({
          query: 'compare risks',
          project_ids: ['proj-a', 'proj-b'],
        }),
      })
    );

    const events = await readSseEvents(res);
    const statusEvents = events.filter((e) => e.event === 'status');
    expect(statusEvents.some((e) => String(e.data?.message).includes('selected projects'))).toBe(true);
  });
});
