import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockStorageUpload = vi.fn();
const mockProcessFile = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
      })),
    },
  })),
}));

vi.mock('@/lib/processing/pipeline', () => ({
  processFile: (...args: unknown[]) => mockProcessFile(...args),
}));

import { POST } from '@/app/api/upload/route';

function buildFileRequest(options: {
  projectId: string;
  fileName?: string;
  fileContent?: string;
  pastedText?: string;
  pastedType?: string;
}) {
  const form = new FormData();
  form.append('project_id', options.projectId);

  if (options.pastedText) {
    form.append('pasted_text', options.pastedText);
    if (options.pastedType) form.append('pasted_type', options.pastedType);
  } else if (options.fileName && options.fileContent !== undefined) {
    form.append(
      'file',
      new Blob([options.fileContent], { type: 'text/markdown' }),
      options.fileName
    );
  }

  return new NextRequest('http://localhost:3000/api/upload', {
    method: 'POST',
    body: form,
  });
}

describe('POST /api/upload integration', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockStorageUpload.mockReset();
    mockProcessFile.mockReset();

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockStorageUpload.mockResolvedValue({ error: null });
    mockProcessFile.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(buildFileRequest({ projectId: 'proj-1', fileName: 'a.md', fileContent: 'x' }));
    expect(res.status).toBe(401);
  });

  it('returns 404 when project is missing', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return {};
    });

    const res = await POST(buildFileRequest({ projectId: 'missing', fileName: 'a.md', fileContent: 'x' }));
    expect(res.status).toBe(404);
  });

  it('uploads markdown files to storage and creates a file record', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'file-1',
            project_id: 'proj-1',
            file_name: 'brief.md',
            status: 'pending',
          },
          error: null,
        }),
      }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'proj-1' } }),
        };
      }
      if (table === 'files') {
        return { insert };
      }
      return {};
    });

    const res = await POST(
      buildFileRequest({
        projectId: 'proj-1',
        fileName: 'brief.md',
        fileContent: '# Hello\n\nDenver approved.',
      })
    );

    expect(res.status).toBe(200);
    expect(mockStorageUpload).toHaveBeenCalledOnce();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-1',
        file_name: 'brief.md',
        source_type: 'note',
        status: 'pending',
      })
    );
    expect(mockProcessFile).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file-1',
        projectId: 'proj-1',
        fileName: 'brief.md',
      })
    );
  });

  it('accepts pasted meeting notes without storage upload', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'file-2', status: 'pending' },
          error: null,
        }),
      }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'proj-1' } }),
        };
      }
      if (table === 'files') {
        return { insert };
      }
      return {};
    });

    const res = await POST(
      buildFileRequest({
        projectId: 'proj-1',
        pastedText: 'Client confirmed Q3 priorities.',
        pastedType: 'meeting',
      })
    );

    expect(res.status).toBe(200);
    expect(mockStorageUpload).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        extracted_text: 'Client confirmed Q3 priorities.',
        source_type: 'meeting',
        storage_path: null,
      })
    );
    expect(mockProcessFile).toHaveBeenCalledWith(
      expect.objectContaining({
        pastedText: 'Client confirmed Q3 priorities.',
      })
    );
  });

  it('returns storage error details when upload fails', async () => {
    mockStorageUpload.mockResolvedValue({ error: { message: 'Bucket not found' } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'proj-1' } }),
        };
      }
      return {};
    });

    const res = await POST(
      buildFileRequest({ projectId: 'proj-1', fileName: 'fail.md', fileContent: 'x' })
    );
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toContain('Bucket not found');
  });
});
