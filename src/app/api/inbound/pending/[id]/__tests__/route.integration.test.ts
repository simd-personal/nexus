import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

import { GET } from '@/app/api/inbound/pending/[id]/route';

const pendingEvent = {
  id: 'evt-1',
  owner_id: 'user-1',
  status: 'pending_assignment',
  from_address: 'sender@example.com',
  subject: 'Weekly update',
  body_text: 'Please review the attached deck before tomorrow.',
  body_preview: 'Please review…',
  payload_storage_path: null,
  attachments_meta: [
    { filename: 'deck.pdf', contentType: 'application/pdf', size: 1200 },
    { filename: 'photo.png', contentType: 'image/png', size: 800, inline: true },
  ],
  attachment_count: 2,
  created_at: '2026-06-27T12:00:00.000Z',
};

describe('GET /api/inbound/pending/[id] integration', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: pendingEvent, error: null });
  });

  it('returns email view data with previewable attachments', async () => {
    const res = await GET(new Request('http://localhost/api/inbound/pending/evt-1'), {
      params: Promise.resolve({ id: 'evt-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.subject).toBe('Weekly update');
    expect(body.text).toContain('attached deck');
    expect(body.assignable).toBe(true);
    expect(body.attachments).toHaveLength(2);
    expect(body.attachments[0]).toMatchObject({
      index: 0,
      filename: 'deck.pdf',
      viewType: 'pdf',
      previewUrl: '/api/inbound/pending/evt-1/attachments/0',
    });
    expect(body.attachments[1]).toMatchObject({
      index: 1,
      filename: 'photo.png',
      viewType: 'image',
      inline: true,
      previewUrl: '/api/inbound/pending/evt-1/attachments/1',
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(new Request('http://localhost/api/inbound/pending/evt-1'), {
      params: Promise.resolve({ id: 'evt-1' }),
    });

    expect(res.status).toBe(401);
  });

  it('returns 410 when the email is no longer pending', async () => {
    mockSingle.mockResolvedValue({
      data: { ...pendingEvent, status: 'dismissed' },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/inbound/pending/evt-1'), {
      params: Promise.resolve({ id: 'evt-1' }),
    });

    expect(res.status).toBe(410);
  });
});
