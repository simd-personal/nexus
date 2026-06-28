import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadProjectFile } from '@/lib/upload/client';

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
});
