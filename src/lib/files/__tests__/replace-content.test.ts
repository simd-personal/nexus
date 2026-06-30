import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findProjectFileByUploadName,
  normalizeUploadFileName,
  replaceProjectFileContent,
} from '@/lib/files/replace-content';

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockEnqueue = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
      })),
    },
  })),
}));

vi.mock('@/lib/processing/enqueue', () => ({
  enqueueFileProcessing: (...args: unknown[]) => mockEnqueue(...args),
}));

vi.mock('@/lib/files/purge-derived-content', () => ({
  purgeFileDerivedContent: vi.fn().mockResolvedValue(undefined),
}));

const baseFile = {
  id: 'file-1',
  project_id: 'proj-a',
  uploaded_by: 'user-1',
  file_name: 'Issue-Tracker-LIVE.docx',
  file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  source_type: 'other',
  storage_path: 'proj-a/old-tracker.docx',
  status: 'processed',
  extracted_text: 'Old tracker content',
  user_note: null,
  origin_file_id: null,
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

function buildSupabase(handlers: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => handlers[table]),
  } as never;
}

describe('replace-content helpers', () => {
  it('matches upload names case-insensitively after sanitization', () => {
    expect(
      findProjectFileByUploadName(
        [{ id: 'file-1', file_name: 'Issue-Tracker-LIVE.docx' }],
        'issue-tracker-live.docx'
      )?.id
    ).toBe('file-1');
  });

  it('returns null when no filename match exists', () => {
    expect(
      findProjectFileByUploadName([{ id: 'file-1', file_name: 'notes.md' }], 'tracker.docx')
    ).toBeNull();
  });
});

describe('replaceProjectFileContent', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockRemove.mockReset();
    mockEnqueue.mockReset();
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  it('replaces storage, resets file row, and re-enqueues processing', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...baseFile, status: 'pending', extracted_text: null },
            error: null,
          }),
        }),
      }),
    });

    const supabase = buildSupabase({
      files: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: baseFile, error: null }),
          }),
        }),
        update,
      },
    });

    const result = await replaceProjectFileContent(supabase, 'file-1', {
      buffer: Buffer.from('updated tracker'),
      fileName: 'Issue-Tracker-LIVE.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    expect(result.file?.status).toBe('pending');
    expect(mockRemove).toHaveBeenCalledWith(['proj-a/old-tracker.docx']);
    expect(mockUpload).toHaveBeenCalled();
    expect(mockEnqueue).toHaveBeenCalledWith('file-1', { resume: false, force: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        extracted_text: null,
        status: 'pending',
        file_name: 'Issue-Tracker-LIVE.docx',
      })
    );
  });

  it('blocks replace while processing is active', async () => {
    const supabase = buildSupabase({
      files: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...baseFile,
                status: 'pending',
              },
              error: null,
            }),
          }),
        }),
      },
    });

    const result = await replaceProjectFileContent(supabase, 'file-1', {
      buffer: Buffer.from('updated tracker'),
      fileName: 'Issue-Tracker-LIVE.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    expect(result.status).toBe(409);
    expect(result.error).toMatch(/still processing/i);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
