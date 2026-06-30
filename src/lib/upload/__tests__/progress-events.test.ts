import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  UPLOAD_PROGRESS_END,
  UPLOAD_PROGRESS_START,
  notifyUploadEnd,
  notifyUploadStart,
} from '@/lib/upload/progress-events';

describe('upload progress events', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dispatches start with file count and names when window is available', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });

    notifyUploadStart([{ name: 'a.pdf' }, { name: 'b.docx' }]);

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(UPLOAD_PROGRESS_START);
    expect(event.detail).toEqual({
      count: 2,
      names: ['a.pdf', 'b.docx'],
    });
  });

  it('does not dispatch start for an empty file list', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });

    notifyUploadStart([]);

    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('dispatches end when window is available', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { dispatchEvent });

    notifyUploadEnd();

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    expect(dispatchEvent.mock.calls[0][0].type).toBe(UPLOAD_PROGRESS_END);
  });

  it('no-ops when window is unavailable', () => {
    vi.stubGlobal('window', undefined);

    expect(() => notifyUploadStart([{ name: 'x.pdf' }])).not.toThrow();
    expect(() => notifyUploadEnd()).not.toThrow();
  });
});
