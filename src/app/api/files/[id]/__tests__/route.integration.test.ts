import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockStorageRemove = vi.fn();

function buildDeleteChain() {
  const chain = {
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
  };
  chain.eq.mockReturnValue(chain);
  chain.is.mockReturnValue(chain);
  chain.in.mockResolvedValue({ error: null });
  chain.eq.mockResolvedValue({ error: null });
  return chain;
}

const deleteChain = buildDeleteChain();
const emptySelectEq = vi.fn().mockResolvedValue({ data: [] });

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'files') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
          delete: vi.fn().mockReturnValue(deleteChain),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: emptySelectEq,
        }),
        delete: vi.fn().mockReturnValue(deleteChain),
      };
    }),
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
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({
      data: {
        id: 'file-1',
        storage_path: 'proj-1/123-brief.md',
        project_id: 'proj-1',
        file_name: 'brief.md',
      },
      error: null,
    });
    emptySelectEq.mockResolvedValue({ data: [] });
    deleteChain.eq.mockReturnValue(deleteChain);
    deleteChain.is.mockReturnValue(deleteChain);
    deleteChain.eq.mockResolvedValue({ error: null });
    deleteChain.in.mockResolvedValue({ error: null });
    mockStorageRemove.mockResolvedValue({ error: null });
  });

  it('deletes storage object and database record', async () => {
    const req = new NextRequest('http://localhost:3000/api/files/file-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'file-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockStorageRemove).toHaveBeenCalledWith(['proj-1/123-brief.md']);
    expect(deleteChain.is).toHaveBeenCalledWith('source_file_id', null);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/files/file-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'file-1' }) });
    expect(res.status).toBe(401);
  });
});
