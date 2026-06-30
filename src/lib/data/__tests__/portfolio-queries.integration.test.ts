import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  ensureFreshAppData: vi.fn(),
  refreshDerivedRecords: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/data/fresh-data', () => ({
  ensureFreshAppData: mocks.ensureFreshAppData,
  refreshDerivedRecords: mocks.refreshDerivedRecords,
  recordCitationsStillValid: () => true,
  sunnyUpdateStillValid: () => true,
}));

import { getDashboardStats } from '@/lib/data/queries';

function createDashboardSupabase(options: {
  projects: Array<{ id: string; portfolio: string }>;
  criticalCount?: number;
  actionItems?: Array<{
    title: string;
    owner: string;
    item_kind: string;
    applies_to_me: boolean;
    matched_terms: string[];
    status: string;
  }>;
}) {
  const createQueryBuilder = (table: string, scopedProjectIds?: string[] | null) => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;

    builder.select = vi.fn(chain);
    builder.eq = vi.fn(chain);
    builder.gte = vi.fn(chain);
    builder.order = vi.fn(chain);
    builder.in = vi.fn((column: string, ids: string[]) => {
      if (column === 'project_id') scopedProjectIds = ids;
      return builder;
    });
    builder.limit = vi.fn(chain);
    builder.single = vi.fn(chain);

    builder.then = (resolve: (value: unknown) => void) => {
      if (table === 'projects') {
        return Promise.resolve({ data: options.projects }).then(resolve);
      }
      if (table === 'critical_items') {
        const count = scopedProjectIds === null ? (options.criticalCount ?? 0) : (options.criticalCount ?? 0);
        return Promise.resolve({ data: [], count }).then(resolve);
      }
      if (table === 'sunny_updates') {
        return Promise.resolve({ data: [] }).then(resolve);
      }
      if (table === 'action_items') {
        const items = (options.actionItems ?? []).filter((item) => item.status === 'open');
        return Promise.resolve({ data: items }).then(resolve);
      }
      if (table === 'files') {
        return Promise.resolve({ data: [] }).then(resolve);
      }
      return Promise.resolve({ data: [] }).then(resolve);
    };

    return builder;
  };

  return {
    from: vi.fn((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_column: string, portfolio: string) =>
              Promise.resolve({
                data: options.projects
                  .filter((project) => project.portfolio === portfolio)
                  .map((project) => ({ id: project.id })),
              })
            ),
          })),
        };
      }

      let scopedProjectIds: string[] | null | undefined;
      const builder = createQueryBuilder(table, scopedProjectIds);
      builder.in = vi.fn((column: string, ids: string[]) => {
        if (column === 'project_id') scopedProjectIds = ids;
        return builder;
      });
      return builder;
    }),
  };
}

describe('getDashboardStats portfolio integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureFreshAppData.mockResolvedValue(undefined);
    mocks.refreshDerivedRecords.mockResolvedValue(new Map());
  });

  it('returns zeroed stats when the scoped portfolio has no projects', async () => {
    mocks.createClient.mockResolvedValue(
      createDashboardSupabase({
        projects: [{ id: 'work-1', portfolio: 'work' }],
        criticalCount: 4,
      })
    );

    const stats = await getDashboardStats('personal');

    expect(stats).toEqual({
      criticalCount: 0,
      newUpdatesCount: 0,
      actionItemsCount: 0,
      conflictsCount: 0,
    });
  });

  it('scopes critical item queries to work project ids', async () => {
    const supabase = createDashboardSupabase({
      projects: [
        { id: 'work-1', portfolio: 'work' },
        { id: 'personal-1', portfolio: 'personal' },
      ],
      criticalCount: 2,
    });
    mocks.createClient.mockResolvedValue(supabase);

    const stats = await getDashboardStats('work');

    expect(stats.criticalCount).toBe(2);
    const criticalInCalls = supabase.from.mock.calls
      .map((call, index) => ({ table: call[0], builder: supabase.from.mock.results[index]?.value }))
      .filter(({ table }) => table === 'critical_items')
      .flatMap(({ builder }) => builder.in?.mock?.calls ?? []);

    expect(criticalInCalls.some((call) => call[0] === 'project_id' && call[1]?.includes('work-1'))).toBe(
      true
    );
    expect(
      criticalInCalls.some((call) => call[0] === 'project_id' && call[1]?.includes('personal-1'))
    ).toBe(false);
  });

  it('aggregates across all projects when scope is all', async () => {
    const supabase = createDashboardSupabase({
      projects: [
        { id: 'work-1', portfolio: 'work' },
        { id: 'personal-1', portfolio: 'personal' },
      ],
      criticalCount: 7,
    });
    mocks.createClient.mockResolvedValue(supabase);

    const stats = await getDashboardStats('all');

    expect(stats.criticalCount).toBe(7);
    const criticalInCalls = supabase.from.mock.calls
      .map((call, index) => ({ table: call[0], builder: supabase.from.mock.results[index]?.value }))
      .filter(({ table }) => table === 'critical_items')
      .flatMap(({ builder }) => builder.in?.mock?.calls ?? []);

    expect(criticalInCalls).toHaveLength(0);
  });
});
