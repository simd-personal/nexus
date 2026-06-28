import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockDelete = vi.fn();
const mockStorageRemove = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
      delete: mockDelete,
    })),
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        remove: mockStorageRemove,
      })),
    },
  })),
}));

import { DELETE } from '@/app/api/files/[id]/route';

describe('DELETE /api/files/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({
      data: {
        id: 'file-1',
        storage_path: 'proj-1/123-brief.md',
        project_id: 'proj-1',
      },
      error: null,
    });
    mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockStorageRemove.mockResolvedValue({ error: null });
  });

  it('deletes storage object and database record', async () => {
    const req = new NextRequest('http://localhost:3000/api/files/file-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'file-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockStorageRemove).toHaveBeenCalledWith(['proj-1/123-brief.md']);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/files/file-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'file-1' }) });
    expect(res.status).toBe(401);
  });
});
