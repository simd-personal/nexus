import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockDeleteProjectAndFiles = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/projects/delete-project', () => ({
  deleteProjectAndFiles: (...args: unknown[]) => mockDeleteProjectAndFiles(...args),
}));

import { DELETE } from '@/app/api/projects/[id]/route';

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockDeleteProjectAndFiles.mockResolvedValue({ deletedFiles: 3 });
  });

  it('deletes project and returns file count', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.deleted_files).toBe(3);
    expect(mockDeleteProjectAndFiles).toHaveBeenCalledWith(expect.anything(), 'proj-1', 'user-1');
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'proj-1' }) });
    expect(res.status).toBe(401);
  });
});
