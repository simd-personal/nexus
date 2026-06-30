import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getDashboardPortfolioPreference: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/data/queries', () => ({
  getDashboardPortfolioPreference: mocks.getDashboardPortfolioPreference,
}));

import { resolveActivePortfolioScope } from '@/lib/data/resolve-portfolio-scope';

describe('resolveActivePortfolioScope integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefers URL scope over saved profile preference', async () => {
    mocks.getDashboardPortfolioPreference.mockResolvedValue('personal');

    await expect(resolveActivePortfolioScope({ portfolio: 'work' })).resolves.toBe('work');
  });

  it('falls back to profile preference when URL param is absent', async () => {
    mocks.getDashboardPortfolioPreference.mockResolvedValue('all');

    await expect(resolveActivePortfolioScope({})).resolves.toBe('all');
  });

  it('defaults to work when profile preference is missing', async () => {
    mocks.getDashboardPortfolioPreference.mockResolvedValue('work');

    await expect(resolveActivePortfolioScope(undefined)).resolves.toBe('work');
  });
});
