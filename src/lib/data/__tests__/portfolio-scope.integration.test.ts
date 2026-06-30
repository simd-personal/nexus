import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getProjectIdsForPortfolioScope } from '@/lib/data/portfolio-scope';

function createProjectsSupabase(rows: Array<{ id: string; portfolio: string }>) {
  return {
    from: vi.fn((table: string) => {
      if (table !== 'projects') {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: string) =>
            Promise.resolve({
              data: rows.filter((row) => row[column as keyof typeof row] === value),
            })
          ),
        })),
      };
    }),
  };
}

describe('getProjectIdsForPortfolioScope integration', () => {
  it('returns null for all-projects scope', async () => {
    const supabase = createProjectsSupabase([
      { id: 'work-1', portfolio: 'work' },
      { id: 'personal-1', portfolio: 'personal' },
    ]);

    await expect(getProjectIdsForPortfolioScope(supabase, 'all')).resolves.toBeNull();
  });

  it('returns only work project ids for work scope', async () => {
    const supabase = createProjectsSupabase([
      { id: 'work-1', portfolio: 'work' },
      { id: 'work-2', portfolio: 'work' },
      { id: 'personal-1', portfolio: 'personal' },
    ]);

    await expect(getProjectIdsForPortfolioScope(supabase, 'work')).resolves.toEqual([
      'work-1',
      'work-2',
    ]);
  });

  it('returns empty array when portfolio has no projects', async () => {
    const supabase = createProjectsSupabase([{ id: 'work-1', portfolio: 'work' }]);

    await expect(getProjectIdsForPortfolioScope(supabase, 'personal')).resolves.toEqual([]);
  });
});
