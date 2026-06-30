import { describe, expect, it } from 'vitest';
import { portfolioLabel, splitProjectsByPortfolio } from '../projects';
import type { ProjectWithStats } from '@/lib/types';

function project(partial: Partial<ProjectWithStats> & Pick<ProjectWithStats, 'id'>): ProjectWithStats {
  return {
    client_name: 'Acme',
    project_name: 'Program',
    description: null,
    status: 'healthy',
    last_summary: null,
    last_activity_at: null,
    portfolio: 'work',
    ...partial,
  };
}

describe('splitProjectsByPortfolio', () => {
  it('groups top-level projects by portfolio', () => {
    const result = splitProjectsByPortfolio([
      project({ id: 'w1', portfolio: 'work' }),
      project({ id: 'p1', portfolio: 'personal', client_name: 'Home' }),
    ]);

    expect(result.work.map((item) => item.id)).toEqual(['w1']);
    expect(result.personal.map((item) => item.id)).toEqual(['p1']);
  });

  it('labels portfolios', () => {
    expect(portfolioLabel('work')).toBe('Work');
    expect(portfolioLabel('personal')).toBe('Personal');
  });
});
