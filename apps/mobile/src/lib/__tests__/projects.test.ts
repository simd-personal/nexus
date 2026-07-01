import { describe, expect, it } from 'vitest';
import { normalizeProjectPortfolios } from '@upperdeck/shared/chat-scope';
import { portfolioLabel, splitProjectsByPortfolio } from '../projects';
import type { ProjectWithStats } from '../types';

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

  it('defaults missing portfolio to work when splitting', () => {
    const result = splitProjectsByPortfolio([
      project({ id: 'w1', portfolio: undefined as never }),
      project({ id: 'p1', portfolio: 'personal', client_name: 'Home' }),
    ]);

    expect(result.work.map((item) => item.id)).toEqual(['w1']);
    expect(result.personal.map((item) => item.id)).toEqual(['p1']);
  });

  it('normalizes nested portfolios before splitting for Sunny scope', () => {
    const normalized = normalizeProjectPortfolios([
      project({
        id: 'personal-root',
        portfolio: 'personal',
        client_name: 'Home',
        sub_projects: [project({ id: 'child', portfolio: undefined as never, project_name: 'Kitchen' })],
      }),
    ]);

    const result = splitProjectsByPortfolio(normalized);
    expect(result.personal.map((item) => item.id)).toEqual(['personal-root']);
    expect(result.personal[0]?.sub_projects?.[0]?.portfolio).toBe('personal');
    expect(result.work).toEqual([]);
  });
});
