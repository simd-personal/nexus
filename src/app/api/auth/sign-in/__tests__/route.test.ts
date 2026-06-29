import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const signInWithPassword = vi.fn();
const signUp = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: (...args: unknown[]) => signUp(...args),
    },
  }),
}));

vi.mock('@/lib/email/send-welcome', () => ({
  sendWelcomeEmail: vi.fn(),
}));

import { POST as signInPost } from '@/app/api/auth/sign-in/route';

describe('POST /api/auth/sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('redirects to dashboard with session cookies on success', async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    const body = new URLSearchParams({
      email: 'user@example.com',
      password: 'secret123',
      redirect: '/dashboard',
    });

    const request = new NextRequest('https://upperdeck.dev/api/auth/sign-in', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const response = await signInPost(request);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://upperdeck.dev/dashboard');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  it('redirects back to login on bad credentials', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });

    const body = new URLSearchParams({
      email: 'user@example.com',
      password: 'wrong',
    });

    const request = new NextRequest('https://upperdeck.dev/api/auth/sign-in', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const response = await signInPost(request);
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('location')).toContain('error=credentials');
  });
});
