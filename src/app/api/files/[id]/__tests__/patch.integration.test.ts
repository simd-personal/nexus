import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockUpdateFileDetails = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock('@/lib/files/actions', () => ({
  updateFileDetails: (...args: unknown[]) => mockUpdateFileDetails(...args),
  deleteProjectFile: vi.fn(),
}));

import { PATCH } from '@/app/api/files/[id]/route';

describe('PATCH /api/files/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockUpdateFileDetails.mockReset();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('updates file name and note', async () => {
    mockUpdateFileDetails.mockResolvedValue({
      file: { id: 'file-1', file_name: 'renamed.jpg', user_note: 'Lobby' },
    });

    const req = new NextRequest('http://localhost:3000/api/files/file-1', {
      method: 'PATCH',
      body: JSON.stringify({ file_name: 'renamed.jpg', user_note: 'Lobby' }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'file-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.file_name).toBe('renamed.jpg');
    expect(mockUpdateFileDetails).toHaveBeenCalledWith(expect.anything(), 'file-1', {
      file_name: 'renamed.jpg',
      user_note: 'Lobby',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/files/file-1', {
      method: 'PATCH',
      body: JSON.stringify({ file_name: 'x' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'file-1' }) });
    expect(res.status).toBe(401);
  });
});
