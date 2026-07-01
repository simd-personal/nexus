import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadProjectFile, uploadProjectFiles } from '@/lib/upload/client';
import {
  UPLOAD_PROGRESS_END,
  UPLOAD_PROGRESS_START,
} from '@/lib/upload/progress-events';

const uploadToSignedUrl = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({ uploadToSignedUrl }),
    },
  }),
}));

/** Mocks the sign → finalize round-trip the upload client now performs. */
function stubUploadFetch(finalize: { ok?: boolean; status?: number; body?: unknown } = {}) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/upload/sign')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ bucket: 'files', path: 'proj-1/123-notes.md', token: 'tok' }),
      });
    }
    return Promise.resolve({
      ok: finalize.ok ?? true,
      status: finalize.status ?? 200,
      headers: { get: () => 'application/json' },
      json: async () => finalize.body ?? { data: { id: 'file-1' } },
    });
  });
}

describe('uploadProjectFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    uploadToSignedUrl.mockClear();
  });

  it('returns ok when API succeeds', async () => {
    vi.stubGlobal('fetch', stubUploadFetch());

    const result = await uploadProjectFile('proj-1', new File(['# Hi'], 'notes.md', { type: 'text/markdown' }));
    expect(result.ok).toBe(true);
    expect(result.fileId).toBe('file-1');
    expect(uploadToSignedUrl).toHaveBeenCalledOnce();
  });

  it('surfaces 401 session errors without parsing HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        redirected: false,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'Unauthorized' }),
      })
    );

    const result = await uploadProjectFile('proj-1', new File(['x'], 'x.md'));
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('handles redirect responses as session expiry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 302,
        redirected: true,
        headers: { get: () => 'text/html' },
      })
    );

    const result = await uploadProjectFile('proj-1', new File(['x'], 'x.md'));
    expect(result.error).toContain('Session expired');
  });

  it('emits one start and one end event per single upload', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal('fetch', stubUploadFetch());

    await uploadProjectFile('proj-1', new File(['x'], 'x.md'));

    const types = dispatchEvent.mock.calls.map(([event]) => (event as Event).type);
    expect(types).toEqual([UPLOAD_PROGRESS_START, UPLOAD_PROGRESS_END]);
  });
});

describe('uploadProjectFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    uploadToSignedUrl.mockClear();
  });

  it('emits one batch start and end event for multiple files', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal('fetch', stubUploadFetch());

    await uploadProjectFiles('proj-1', [
      new File(['a'], 'a.md'),
      new File(['b'], 'b.md'),
    ]);

    const startEvents = dispatchEvent.mock.calls.filter(
      ([event]) => (event as CustomEvent).type === UPLOAD_PROGRESS_START
    );
    const endEvents = dispatchEvent.mock.calls.filter(
      ([event]) => (event as Event).type === UPLOAD_PROGRESS_END
    );
    expect(startEvents).toHaveLength(1);
    expect(endEvents).toHaveLength(1);
    expect((startEvents[0][0] as CustomEvent).detail).toEqual({
      count: 2,
      names: ['a.md', 'b.md'],
    });
  });
});
