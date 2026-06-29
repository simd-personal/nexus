import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockDeleteProjectAndFiles = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/projects/delete-project', () => ({
  deleteProjectAndFiles: (...args: unknown[]) => mockDeleteProjectAndFiles(...args),
}));

import { DELETE, GET } from '@/app/api/projects/[id]/route';

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'proj-1',
              client_name: 'Acme',
              project_name: 'Q3',
              last_summary: 'Launch risk noted',
              status: 'active',
              last_activity_at: '2026-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
    });
  });

  it('returns project summary fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/projects/proj-1');
    const res = await GET(req, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.last_summary).toBe('Launch risk noted');
  });
});

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
