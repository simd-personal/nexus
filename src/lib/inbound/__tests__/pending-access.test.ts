import { describe, expect, it, vi } from 'vitest';
import { canAccessPendingEvent, getPendingInboundEventForUser } from '@/lib/inbound/pending-access';

function mockSupabase(event: Record<string, unknown> | null, error: unknown = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: event, error }),
    })),
  };
}

const pendingEvent = {
  id: 'evt-1',
  owner_id: 'user-1',
  status: 'pending_assignment',
  from_address: 'sender@example.com',
  subject: 'Weekly update',
  body_text: 'Please review the deck.',
  body_preview: 'Please review…',
  payload_storage_path: null,
  attachments_meta: [{ filename: 'deck.pdf', contentType: 'application/pdf', size: 1200 }],
  attachment_count: 1,
  created_at: '2026-06-27T12:00:00.000Z',
};

describe('canAccessPendingEvent', () => {
  it('allows access when owner is unset or matches the user', () => {
    expect(canAccessPendingEvent({ owner_id: null }, 'user-1')).toBe(true);
    expect(canAccessPendingEvent({ owner_id: 'user-1' }, 'user-1')).toBe(true);
    expect(canAccessPendingEvent({ owner_id: 'user-2' }, 'user-1')).toBe(false);
  });
});

describe('getPendingInboundEventForUser', () => {
  it('returns the event for a viewable pending inbox item', async () => {
    const supabase = mockSupabase(pendingEvent);
    const result = await getPendingInboundEventForUser(supabase as never, 'user-1', 'evt-1');

    expect('event' in result).toBe(true);
    if ('event' in result) {
      expect(result.event.id).toBe('evt-1');
      expect(result.event.subject).toBe('Weekly update');
    }
  });

  it('returns 404 when the event does not exist', async () => {
    const supabase = mockSupabase(null, { message: 'not found' });
    const result = await getPendingInboundEventForUser(supabase as never, 'user-1', 'missing');

    expect(result).toEqual({ error: 'Inbound email not found', status: 404 });
  });

  it('returns 403 when the event belongs to another user', async () => {
    const supabase = mockSupabase(pendingEvent);
    const result = await getPendingInboundEventForUser(supabase as never, 'user-2', 'evt-1');

    expect(result).toEqual({ error: 'Unauthorized', status: 403 });
  });

  it('returns 410 when the event is no longer in the inbox', async () => {
    const supabase = mockSupabase({ ...pendingEvent, status: 'assigned' });
    const result = await getPendingInboundEventForUser(supabase as never, 'user-1', 'evt-1');

    expect(result).toEqual({ error: 'This email is no longer in the inbox', status: 410 });
  });
});
