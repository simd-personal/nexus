import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockShareFileToProject = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/files/actions', () => ({
  shareFileToProject: (...args: unknown[]) => mockShareFileToProject(...args),
}));

import { POST } from '@/app/api/files/[id]/share/route';

describe('POST /api/files/[id]/share', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockShareFileToProject.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('shares a file copy to another project', async () => {
    mockShareFileToProject.mockResolvedValue({
      file: { id: 'file-2', project_id: 'proj-b', origin_file_id: 'file-1' },
    });

    const req = new NextRequest('http://localhost:3000/api/files/file-1/share', {
      method: 'POST',
      body: JSON.stringify({ target_project_id: 'proj-b' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'file-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.origin_file_id).toBe('file-1');
    expect(mockShareFileToProject).toHaveBeenCalledWith(expect.anything(), 'file-1', 'proj-b');
  });
});
