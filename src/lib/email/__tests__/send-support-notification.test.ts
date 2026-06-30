import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock('@/lib/email/client', () => ({
  getSupportInboxAddress: () => 'support@upperdeck.dev',
  sendEmail: mocks.sendEmail,
}));

import { sendSupportRequestToSupport } from '@/lib/email/send-support-notification';

describe('sendSupportRequestToSupport', () => {
  beforeEach(() => {
    mocks.sendEmail.mockReset();
    mocks.sendEmail.mockResolvedValue({ sent: true });
  });

  it('forwards screenshot attachments to the support inbox', async () => {
    await sendSupportRequestToSupport(
      {
        fullName: 'Alex Rivera',
        email: 'alex@acme.com',
        category: 'bug',
        message: 'Search bar is empty after submit.',
        attachmentFilename: 'search-bug.png',
      },
      { filename: 'search-bug.png', buffer: Buffer.from('png-bytes') }
    );

    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'support@upperdeck.dev',
        replyTo: 'alex@acme.com',
        attachments: [{ filename: 'search-bug.png', content: expect.any(Buffer) }],
      })
    );
  });
});
