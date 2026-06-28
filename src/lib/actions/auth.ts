'use server';

import { createClient, requireUser } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/auth/site-url';

export async function signUpIndividual(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const email = input.email.trim();
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!email || !fullName || !password) {
    return { error: 'Name, email, and password are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        account_type: 'individual',
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  if (data.session) return { success: true, immediate: true };
  return {
    success: true,
    message:
      'Account created. Check your email to confirm your address, then sign in.',
  };
}

export async function requestPasswordReset(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return { error: 'Email is required' };

  const supabase = await createClient();
  const siteUrl = getSiteUrl();
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
  const siteUrl = getSiteUrl();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmed,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) return { error: error.message };
  return { success: true, message: 'Confirmation email sent. Check your inbox.' };
}
