import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterResultsToAccessibleProjects,
  retrieveForQuery,
  type RetrievedChunk,
} from '@/lib/search/retrieve';

const foreignChunk: RetrievedChunk = {
  id: 'chunk-foreign',
  project_id: 'project-foreign',
  file_id: 'file-foreign',
  chunk_index: 0,
  text: 'PB Hilo denied claims confidential data',
  metadata: { file_name: 'PB_Denial_Actions_Plan.xlsx' },
  similarity: 0.95,
  match_reason: 'Semantic match',
};

const ownChunk: RetrievedChunk = {
  id: 'chunk-own',
  project_id: 'project-own',
  file_id: 'file-own',
  chunk_index: 0,
  text: 'My project notes',
  metadata: { file_name: 'notes.md' },
  similarity: 0.7,
  match_reason: 'Semantic match',
};

describe('filterResultsToAccessibleProjects', () => {
  it('drops rows from projects the user cannot access', () => {
    const filtered = filterResultsToAccessibleProjects(
      [foreignChunk, ownChunk],
      new Set(['project-own'])
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].project_id).toBe('project-own');
  });

  it('returns empty when the user has no accessible projects', () => {
    expect(filterResultsToAccessibleProjects([foreignChunk], new Set())).toEqual([]);
  });
});

function buildSupabaseMock(accessibleProjectIds: string[]) {
  const empty = Promise.resolve({ data: [] as unknown[] });
  const awaitable = {
    eq: () => awaitable,
    in: () => awaitable,
    limit: () => awaitable,
    then: (
      resolve: (value: { data: unknown[] }) => void,
      reject?: (reason?: unknown) => void
    ) => empty.then(resolve, reject),
  };

  const chain = () => ({
    select: () => chain(),
    not: () => chain(),
    eq: () => awaitable,
    in: () => awaitable,
    limit: () => awaitable,
    then: (
      resolve: (value: { data: unknown[] }) => void,
      reject?: (reason?: unknown) => void
    ) => empty.then(resolve, reject),
  });

  return {
    rpc: vi.fn((fn: string) => {
      if (fn === 'match_chunks') {
        return Promise.resolve({ data: [foreignChunk] });
      }
      return Promise.resolve({ data: [] });
    }),
    from: vi.fn((table: string) => {
      if (table === 'projects') {
        const projectRows = accessibleProjectIds.map((id) => ({
          id,
          client_name: 'Client',
          project_name: 'Project',
          last_summary: null,
        }));
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: projectRows.map(({ id }) => ({ id })) }),
            in: () => Promise.resolve({ data: projectRows }),
            then: (
              resolve: (value: { data: Array<{ id: string }> }) => void,
              reject?: (reason?: unknown) => void
            ) =>
              Promise.resolve({ data: projectRows.map(({ id }) => ({ id })) }).then(resolve, reject),
          }),
        };
      }
      return chain();
    }),
  };
}

describe('retrieveForQuery tenant isolation', () => {
  it('filters RPC hits that belong to another account', async () => {
    const supabase = buildSupabaseMock(['project-own']);

    const results = await retrieveForQuery(supabase as never, 'PB Hilo', [0.1], {
      limit: 10,
    });

    expect(results.some((r) => r.project_id === 'project-foreign')).toBe(false);
  });

  it('returns nothing when the user has no projects', async () => {
    const supabase = buildSupabaseMock([]);

    const results = await retrieveForQuery(supabase as never, 'PB Hilo', [0.1], {
      limit: 10,
    });

    expect(results).toEqual([]);
  });

  it('restricts results to an explicit multi-project scope', async () => {
    const supabase = buildSupabaseMock(['project-own', 'project-other']);

    const results = await retrieveForQuery(supabase as never, 'notes', [0.1], {
      projectIds: ['project-own', 'project-other'],
      limit: 10,
    });

    expect(results.some((r) => r.project_id === 'project-foreign')).toBe(false);
    expect(mockRpcNotCalledWithForeignOnly(supabase)).toBe(true);
  });
});

function mockRpcNotCalledWithForeignOnly(supabase: ReturnType<typeof buildSupabaseMock>): boolean {
  const rpcCalls = supabase.rpc.mock.calls as Array<[string, { filter_project_id?: string | null }]>;
  return rpcCalls.every(([, args]) => args?.filter_project_id !== 'project-foreign');
}
