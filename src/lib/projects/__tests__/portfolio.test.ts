import { describe, expect, it } from 'vitest';
import {
  dashboardScopeLabel,
  parseDashboardPortfolioScope,
  parseProjectPortfolio,
  projectPortfolioLabel,
  resolveDashboardPortfolioScope,
} from '@/lib/projects/portfolio';

describe('portfolio helpers', () => {
  it('parses project portfolio with work default', () => {
    expect(parseProjectPortfolio('personal')).toBe('personal');
    expect(parseProjectPortfolio('work')).toBe('work');
    expect(parseProjectPortfolio(undefined)).toBe('work');
  });

  it('parses dashboard scope', () => {
    expect(parseDashboardPortfolioScope('all')).toBe('all');
    expect(parseDashboardPortfolioScope('personal')).toBe('personal');
    expect(parseDashboardPortfolioScope('nope')).toBeNull();
  });

  it('resolves dashboard scope from url then profile default', () => {
    expect(resolveDashboardPortfolioScope('personal', 'work')).toBe('personal');
    expect(resolveDashboardPortfolioScope(null, 'all')).toBe('all');
    expect(resolveDashboardPortfolioScope(undefined, undefined)).toBe('work');
  });

  it('labels portfolios for UI', () => {
    expect(projectPortfolioLabel('work')).toBe('Work');
    expect(dashboardScopeLabel('all')).toBe('All projects');
  });
});
