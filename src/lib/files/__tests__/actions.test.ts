import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  moveFileToProject,
  removeFileFromProject,
  shareFileToProject,
  updateFileDetails,
} from '@/lib/files/actions';

const mockCopy = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createServiceClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        copy: mockCopy,
        remove: mockRemove,
      })),
    },
  })),
}));

function buildSupabase(handlers: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => handlers[table]),
  } as never;
}

const baseFile = {
  id: 'file-1',
  project_id: 'proj-a',
  uploaded_by: 'user-1',
  file_name: 'photo.jpg',
  file_type: 'image/jpeg',
  source_type: 'note',
  storage_path: 'proj-a/1-photo.jpg',
  status: 'processed',
  extracted_text: 'whiteboard notes',
  user_note: 'Kickoff photo',
  origin_file_id: null,
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

describe('file actions', () => {
  beforeEach(() => {
    mockCopy.mockReset();
    mockRemove.mockReset();
    mockCopy.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
  });

  it('updates rename and note fields', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...baseFile, file_name: 'site-photo.jpg', user_note: 'Lobby signage' },
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

    const result = await updateFileDetails(supabase, 'file-1', {
      file_name: 'site-photo.jpg',
      user_note: 'Lobby signage',
    });

    expect(result.file?.file_name).toBe('site-photo.jpg');
    expect(update).toHaveBeenCalledWith({
      file_name: 'site-photo.jpg',
      user_note: 'Lobby signage',
    });
  });

  it('moves a file to another project and preserves lineage', async () => {
    const fileUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...baseFile, project_id: 'proj-b' },
            error: null,
          }),
        }),
      }),
    });

    const timelineSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [{ event_type: 'file_upload', title: 'Uploaded: photo.jpg', description: 'summary', created_at: '2026-01-01T00:00:00Z' }],
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
        update: fileUpdate,
      },
      projects: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'proj-b' }, error: null }),
          }),
        }),
      },
      timeline_events: {
        select: timelineSelect,
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      },
      chunks: {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
      entities: {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    });

    const result = await moveFileToProject(supabase, 'file-1', 'proj-b');
    expect(result.file?.project_id).toBe('proj-b');
    expect(mockCopy).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith(['proj-a/1-photo.jpg']);
    expect(fileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-b',
        metadata: expect.objectContaining({
          lineage: expect.objectContaining({
            transfer_type: 'move',
            timeline_snapshot: expect.any(Array),
          }),
        }),
      })
    );
  });

  it('shares a file as a copy in another project', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { ...baseFile, id: 'file-2', project_id: 'proj-b', origin_file_id: 'file-1' },
          error: null,
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
        insert,
      },
      projects: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'proj-b' }, error: null }),
          }),
        }),
      },
      timeline_events: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      },
      chunks: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ chunk_index: 0, text: 'chunk', metadata: {}, embedding: null }] }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const result = await shareFileToProject(supabase, 'file-1', 'proj-b');
    expect(result.file?.origin_file_id).toBe('file-1');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-b',
        origin_file_id: 'file-1',
      })
    );
  });

  it('removes a shared copy without requiring origin deletion', async () => {
    const sharedCopy = { ...baseFile, id: 'file-2', origin_file_id: 'file-1', project_id: 'proj-b' };
    const deleteEq = vi.fn().mockResolvedValue({ error: null });

    const supabase = buildSupabase({
      files: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: sharedCopy, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
      },
      chunks: {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    });

    const result = await removeFileFromProject(supabase, 'file-2', 'proj-b');
    expect(result.error).toBeUndefined();
    expect(deleteEq).toHaveBeenCalledWith('id', 'file-2');
    expect(mockRemove).toHaveBeenCalled();
  });
});
