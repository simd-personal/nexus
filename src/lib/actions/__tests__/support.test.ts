import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
  sendSupportRequestToSupport: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  requireUser: mocks.requireUser,
  createClient: mocks.createClient,
}));

vi.mock('@/lib/email/send-support-notification', () => ({
  sendSupportRequestToSupport: mocks.sendSupportRequestToSupport,
}));

import { submitSupportRequest } from '@/lib/actions/support';

function buildFormData(fields: Record<string, string>, file?: File) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  if (file) formData.set('screenshot', file);
  return formData;
}

describe('submitSupportRequest', () => {
  beforeEach(() => {
    mocks.requireUser.mockReset();
    mocks.createClient.mockReset();
    mocks.sendSupportRequestToSupport.mockReset();

    mocks.requireUser.mockResolvedValue({
      id: 'user-1',
      email: 'alex@acme.com',
      user_metadata: { full_name: 'Alex Rivera' },
    });
    mocks.createClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { full_name: 'Alex Rivera' },
            }),
          })),
        })),
      })),
    });
    mocks.sendSupportRequestToSupport.mockResolvedValue({ sent: true });
  });

  it('sends feedback without an attachment', async () => {
    const result = await submitSupportRequest(
      { status: 'idle', message: '' },
      buildFormData({
        category: 'feedback',
        message: 'Love the dashboard layout and Sunny updates.',
      })
    );

    expect(result.status).toBe('success');
    expect(mocks.sendSupportRequestToSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alex@acme.com',
        category: 'feedback',
        attachmentFilename: null,
      }),
      null
    );
  });

  it('emails bug reports with an attached screenshot', async () => {
    const screenshot = new File([new Uint8Array([1, 2, 3])], 'broken-search.png', {
      type: 'image/png',
    });

    const result = await submitSupportRequest(
      { status: 'idle', message: '' },
      buildFormData(
        {
          category: 'bug',
          message: 'Dashboard search does not submit to Sunny.',
        },
        screenshot
      )
    );

    expect(result.status).toBe('success');
    expect(result.message).toContain('24–48 hours');
    expect(mocks.sendSupportRequestToSupport).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'bug',
        attachmentFilename: 'broken-search.png',
      }),
      expect.objectContaining({
        filename: 'broken-search.png',
        buffer: expect.any(Buffer),
      })
    );
  });

  it('returns validation errors for short messages', async () => {
    const result = await submitSupportRequest(
      { status: 'idle', message: '' },
      buildFormData({
        category: 'idea',
        message: 'Too short',
      })
    );

    expect(result.status).toBe('error');
    expect(mocks.sendSupportRequestToSupport).not.toHaveBeenCalled();
  });
});
