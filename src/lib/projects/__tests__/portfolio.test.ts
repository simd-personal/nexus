import { describe, expect, it } from 'vitest';
import {
  dashboardScopeLabel,
  parseDashboardPortfolioScope,
  parseProjectPortfolio,
  projectPortfolioLabel,
  resolveDashboardPortfolioScope,
  portfolioScopeHref,
  globalChatScopeHref,
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

  it('builds scoped hrefs for aggregate pages', () => {
    expect(portfolioScopeHref('/updates', 'personal')).toBe('/updates?portfolio=personal');
    expect(portfolioScopeHref('/dashboard', 'work')).toBe('/dashboard?portfolio=work');
  });

  it('builds scoped chat hrefs', () => {
    expect(globalChatScopeHref('/search', 'personal')).toBe('/search?portfolio=personal');
    expect(globalChatScopeHref('/sunny', 'all')).toBe('/sunny?portfolio=all');
    expect(globalChatScopeHref('/search')).toBe('/search');
  });
});
