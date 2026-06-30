import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getUserFromBearerToken,
  parseBearerToken,
  requireRequestAuth,
} from '@/lib/supabase/request-auth';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
  })),
}));

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe('parseBearerToken', () => {
  it('extracts bearer tokens', () => {
    const request = new Request('https://example.com', {
      headers: { authorization: 'Bearer abc.def.ghi' },
    });
    expect(parseBearerToken(request)).toBe('abc.def.ghi');
  });

  it('returns null when header missing', () => {
    expect(parseBearerToken(new Request('https://example.com'))).toBeNull();
  });
});

describe('getUserFromBearerToken', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it('returns user for valid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const user = await getUserFromBearerToken('token');
    expect(user?.id).toBe('user-1');
  });

  it('returns null for invalid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    expect(await getUserFromBearerToken('bad')).toBeNull();
  });
});

describe('requireRequestAuth', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    const result = await requireRequestAuth(
      new Request('https://example.com', {
        headers: { authorization: 'Bearer bad' },
      })
    );
    expect(result.response?.status).toBe(401);
  });
});
