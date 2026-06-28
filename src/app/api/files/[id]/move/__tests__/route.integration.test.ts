import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockMoveFileToProject = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/files/actions', () => ({
  moveFileToProject: (...args: unknown[]) => mockMoveFileToProject(...args),
}));

import { POST } from '@/app/api/files/[id]/move/route';

describe('POST /api/files/[id]/move', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockMoveFileToProject.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('moves a file to the requested project', async () => {
    mockMoveFileToProject.mockResolvedValue({
      file: { id: 'file-1', project_id: 'proj-b' },
    });

    const req = new NextRequest('http://localhost:3000/api/files/file-1/move', {
      method: 'POST',
      body: JSON.stringify({ target_project_id: 'proj-b' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'file-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.project_id).toBe('proj-b');
    expect(mockMoveFileToProject).toHaveBeenCalledWith(expect.anything(), 'file-1', 'proj-b');
  });

  it('requires target_project_id', async () => {
    const req = new NextRequest('http://localhost:3000/api/files/file-1/move', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'file-1' }) });
    expect(res.status).toBe(400);
  });
});
