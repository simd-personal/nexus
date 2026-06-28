import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockResolvePendingEmailPayload = vi.fn();

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

vi.mock('@/lib/inbound/pending-content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/inbound/pending-content')>();
  return {
    ...actual,
    resolvePendingEmailPayload: (...args: unknown[]) => mockResolvePendingEmailPayload(...args),
  };
});

import { GET } from '@/app/api/inbound/pending/[id]/attachments/[index]/route';

const pendingEvent = {
  id: 'evt-1',
  owner_id: 'user-1',
  status: 'pending_assignment',
  from_address: 'sender@example.com',
  subject: 'Weekly update',
  body_text: 'Please review the attached deck.',
  body_preview: 'Please review…',
  payload_storage_path: 'pending/evt-1.json',
  attachments_meta: [{ filename: 'deck.pdf', contentType: 'application/pdf', size: 8 }],
  attachment_count: 1,
  created_at: '2026-06-27T12:00:00.000Z',
};

const payload = {
  from: 'sender@example.com',
  to: ['u.token@inbound.upperdeck.dev'],
  subject: 'Weekly update',
  text: 'Please review the attached deck.',
  attachments: [
    {
      filename: 'deck.pdf',
      contentType: 'application/pdf',
      content: Buffer.from('%PDF-1.4'),
    },
    {
      filename: 'notes.txt',
      contentType: 'text/plain',
      content: Buffer.from('Line one\nLine two'),
    },
  ],
};

describe('GET /api/inbound/pending/[id]/attachments/[index] integration', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: pendingEvent, error: null });
    mockResolvePendingEmailPayload.mockResolvedValue(payload);
  });

  it('returns attachment bytes inline with content type', async () => {
    const req = new NextRequest('http://localhost/api/inbound/pending/evt-1/attachments/0');
    const res = await GET(req, { params: Promise.resolve({ id: 'evt-1', index: '0' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('inline');
    expect(res.headers.get('Content-Disposition')).toContain('deck.pdf');
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('%PDF-1.4');
  });

  it('returns attachment disposition when download is requested', async () => {
    const req = new NextRequest(
      'http://localhost/api/inbound/pending/evt-1/attachments/1?download=1'
    );
    const res = await GET(req, { params: Promise.resolve({ id: 'evt-1', index: '1' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(Buffer.from(await res.arrayBuffer()).toString()).toBe('Line one\nLine two');
  });

  it('returns 400 for invalid attachment index', async () => {
    const req = new NextRequest('http://localhost/api/inbound/pending/evt-1/attachments/bad');
    const res = await GET(req, { params: Promise.resolve({ id: 'evt-1', index: 'bad' }) });

    expect(res.status).toBe(400);
  });

  it('returns 404 when attachment index is out of range', async () => {
    const req = new NextRequest('http://localhost/api/inbound/pending/evt-1/attachments/9');
    const res = await GET(req, { params: Promise.resolve({ id: 'evt-1', index: '9' }) });

    expect(res.status).toBe(404);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost/api/inbound/pending/evt-1/attachments/0');
    const res = await GET(req, { params: Promise.resolve({ id: 'evt-1', index: '0' }) });

    expect(res.status).toBe(401);
  });
});
