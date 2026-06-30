import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockCreateProjectForUser = vi.fn();

vi.mock('@/lib/supabase/request-auth', () => ({
  requireRequestAuth: vi.fn(async () => ({
    user: { id: 'user-1' },
    supabase: {},
    response: null,
  })),
}));

vi.mock('@/lib/projects/create-project-core', () => ({
  createProjectForUser: (...args: unknown[]) => mockCreateProjectForUser(...args),
  createProjectInputFromFormData: (formData: FormData) => ({
    clientName: String(formData.get('client_name') ?? ''),
    projectName: String(formData.get('project_name') ?? ''),
    description: (formData.get('description') as string | null) ?? null,
    sunnyNotes: (formData.get('sunny_notes') as string | null) ?? null,
    parentProjectId: (formData.get('parent_project_id') as string | null) ?? null,
    portfolio: (formData.get('portfolio') as string | null) ?? null,
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { requireRequestAuth } from '@/lib/supabase/request-auth';
import { POST } from '@/app/api/projects/route';

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: { id: 'user-1' } as never,
      supabase: {} as never,
      response: null,
    });
    mockCreateProjectForUser.mockResolvedValue({
      data: { id: 'proj-1', client_name: 'Acme', project_name: 'Rollout' },
    });
  });

  it('creates a project for authenticated users', async () => {
    const formData = new FormData();
    formData.set('client_name', 'Acme');
    formData.set('project_name', 'Rollout');
    formData.set('portfolio', 'work');

    const request = new Request('http://localhost:3000/api/projects', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('proj-1');
    expect(mockCreateProjectForUser).toHaveBeenCalled();
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireRequestAuth).mockResolvedValue({
      user: null,
      supabase: null,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) as never,
    });

    const request = new Request('http://localhost:3000/api/projects', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockCreateProjectForUser).not.toHaveBeenCalled();
  });
});
