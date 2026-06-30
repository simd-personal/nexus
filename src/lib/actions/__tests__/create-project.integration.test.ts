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

import { createProject } from '@/lib/actions/projects';

describe('createProject server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: 'user-1' });
    mocks.countUserProjects.mockResolvedValue(0);
    mocks.getBillingContextForUser.mockResolvedValue({ isPro: true, projectLimit: null });
  });

  it('creates a project without AI enrichment and leaves summary empty', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'proj-1', portfolio: 'personal' },
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
          return { insert };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('client_name', 'State Farm');
    formData.set('project_name', 'Litigation');
    formData.set('portfolio', 'personal');
    formData.set('sunny_notes', 'Track repair orders and mileage disputes.');

    const result = await createProject(formData);

    expect(result.data?.id).toBe('proj-1');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_name: 'State Farm',
        project_name: 'Litigation',
        portfolio: 'personal',
        description: 'Track repair orders and mileage disputes.',
        last_summary: null,
      })
    );
  });

  it('requires client and project names', async () => {
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
        throw new Error(`Unexpected table ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('client_name', 'Acme');

    const result = await createProject(formData);

    expect(result.error).toContain('required');
  });
});
