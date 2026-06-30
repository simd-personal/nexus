import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadProjectFile, uploadProjectFiles } from '@/lib/upload/client';
import {
  UPLOAD_PROGRESS_END,
  UPLOAD_PROGRESS_START,
} from '@/lib/upload/progress-events';

describe('uploadProjectFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns ok when API succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: { id: 'file-1' } }),
      })
    );

    const result = await uploadProjectFile('proj-1', new File(['# Hi'], 'notes.md', { type: 'text/markdown' }));
    expect(result.ok).toBe(true);
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
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: { id: 'file-1' } }),
      })
    );

    await uploadProjectFile('proj-1', new File(['x'], 'x.md'));

    const types = dispatchEvent.mock.calls.map(([event]) => (event as Event).type);
    expect(types).toEqual([UPLOAD_PROGRESS_START, UPLOAD_PROGRESS_END]);
  });
});

describe('uploadProjectFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits one batch start and end event for multiple files', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ data: { id: 'file-1' } }),
      })
    );

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
