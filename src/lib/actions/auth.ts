'use server';

import { createClient, requireUser } from '@/lib/supabase/server';

export async function requestPasswordReset(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return { error: 'Email is required' };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });

  if (error) return { error: error.message };
  return {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };
}

export async function updatePassword(newPassword: string) {
  const user = await requireUser();
  if (!user) return { error: 'Not authenticated' };
  if (newPassword.length < 8) return { error: 'Password must be at least 8 characters' };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export async function resendSignupConfirmation(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return { error: 'Email is required' };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmed,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: true, message: 'Confirmation email sent. Check your inbox.' };
}
