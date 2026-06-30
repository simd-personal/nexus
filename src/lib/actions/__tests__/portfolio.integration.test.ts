import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  countUserProjects: vi.fn(),
  getBillingContextForUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('@/lib/supabase/server', () => ({
  requireUser: mocks.requireUser,
  createClient: mocks.createClient,
}));

vi.mock('@/lib/billing/limits', () => ({
  countUserProjects: mocks.countUserProjects,
  getBillingContextForUser: mocks.getBillingContextForUser,
}));

import {
  createProject,
  setDashboardPortfolio,
  updateProjectPortfolio,
} from '@/lib/actions/projects';

describe('portfolio server actions integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: 'user-1' });
    mocks.countUserProjects.mockResolvedValue(0);
    mocks.getBillingContextForUser.mockResolvedValue({ isPro: true, projectLimit: null });
  });

  it('inherits parent portfolio when creating a workstream', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'child-1', portfolio: 'personal' },
          error: null,
        }),
      }),
    });

    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { account_type: 'individual' } }),
              }),
            }),
          };
        }
        if (table === 'projects') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'parent-1',
                    owner_id: 'user-1',
                    parent_project_id: null,
                    client_name: 'Home',
                    portfolio: 'personal',
                  },
                }),
              }),
            }),
            insert,
          };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('client_name', 'Home');
    formData.set('project_name', 'Renovation');
    formData.set('parent_project_id', 'parent-1');
    formData.set('portfolio', 'work');

    const result = await createProject(formData);

    expect(result.data?.id).toBe('child-1');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        parent_project_id: 'parent-1',
        portfolio: 'personal',
        last_summary: null,
      })
    );
  });

  it('cascades portfolio updates to sub-projects', async () => {
    const parentUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const childUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    let projectUpdateCount = 0;

    mocks.createClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table !== 'projects') throw new Error(`Unexpected table ${table}`);
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'parent-1', parent_project_id: null },
              }),
            }),
          }),
          update: vi.fn((payload: { portfolio: string }) => {
            projectUpdateCount += 1;
            if (projectUpdateCount === 1) return parentUpdate(payload);
            return childUpdate(payload);
          }),
        };
      }),
    });

    const formData = new FormData();
    formData.set('portfolio', 'personal');

    const result = await updateProjectPortfolio('parent-1', { status: 'idle', message: '' }, formData);

    expect(result.status).toBe('success');
    expect(parentUpdate).toHaveBeenCalledWith({ portfolio: 'personal' });
    expect(childUpdate).toHaveBeenCalledWith({ portfolio: 'personal' });
  });

  it('rejects portfolio changes on sub-projects', async () => {
    mocks.createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'child-1', parent_project_id: 'parent-1' },
            }),
          }),
        }),
      })),
    });

    const formData = new FormData();
    formData.set('portfolio', 'work');

    const result = await updateProjectPortfolio('child-1', { status: 'idle', message: '' }, formData);

    expect(result.status).toBe('error');
    expect(result.message).toContain('parent program');
  });

  it('persists dashboard portfolio preference on profile', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mocks.createClient.mockResolvedValue({
      from: vi.fn(() => ({
        update,
      })),
    });

    const result = await setDashboardPortfolio('personal');

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({ dashboard_portfolio: 'personal' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});
