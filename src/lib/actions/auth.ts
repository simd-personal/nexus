'use server';

import { createClient, requireUser } from '@/lib/supabase/server';
import {
  getAuthCallbackUrlFromHeaders,
  getSiteUrlFromHeaders,
} from '@/lib/auth/site-url';
import {
  isDuplicateSignUp,
  isEmailRateLimitError,
  mapAuthErrorMessage,
} from '@/lib/auth/auth-errors';
import { recoverAccountAfterEmailRateLimit } from '@/lib/auth/email-rate-limit-recovery';

export async function signUpIndividual(input: {
  email: string;
  password: string;
  fullName: string;
  checkoutPlan?: 'pro' | 'pro-annual' | null;
}) {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const password = input.password;

  if (!email || !fullName || !password) {
    return { error: 'Name, email, and password are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const emailRedirectTo = await getAuthCallbackUrlFromHeaders();
  const userMetadata: Record<string, string> = {
    full_name: fullName,
    account_type: 'individual',
  };
  if (input.checkoutPlan) {
    userMetadata.pending_checkout_plan = input.checkoutPlan;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo,
    },
  });

  if (error) {
    if (isEmailRateLimitError(error.message)) {
      const recovery = await recoverAccountAfterEmailRateLimit({
        email,
        password,
        fullName,
      });
      if (recovery.recovered) {
        return { success: true, message: recovery.message, recoveredFromRateLimit: true };
      }
    }
    return {
      error: mapAuthErrorMessage(error.message),
      rateLimited: isEmailRateLimitError(error.message),
    };
  }

  if (isDuplicateSignUp(data)) {
    const recovery = await recoverAccountAfterEmailRateLimit({
      email,
      password,
      fullName,
    });
    if (recovery.recovered) {
      return { success: true, message: recovery.message, recoveredFromRateLimit: true };
    }
    return {
      error:
        'An account with this email already exists. Sign in instead, or use Forgot password if you need help.',
      duplicateEmail: true,
    };
  }

  if (data.session) return { success: true, immediate: true };
  return {
    success: true,
    message:
      'Account created. Check your email to confirm your address, then sign in.',
  };
}

export async function signInIndividual(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: mapAuthErrorMessage(error.message) };
  }

  return { success: true };
}

export async function requestPasswordReset(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required' };

  const supabase = await createClient();
  const siteUrl = await getSiteUrlFromHeaders();
  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });

  if (error) {
    return {
      error: mapAuthErrorMessage(error.message),
      rateLimited: isEmailRateLimitError(error.message),
    };
  }
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
  if (error) return { error: mapAuthErrorMessage(error.message) };
  return { success: true };
}

export async function resendSignupConfirmation(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: 'Email is required' };

  const supabase = await createClient();
  const emailRedirectTo = await getAuthCallbackUrlFromHeaders();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: trimmed,
    options: { emailRedirectTo },
  });

  if (error) {
    if (isEmailRateLimitError(error.message)) {
      const recovery = await recoverAccountAfterEmailRateLimit({ email: trimmed });
      if (recovery.recovered) {
        return { success: true, message: recovery.message, recoveredFromRateLimit: true };
      }
    }
    return {
      error: mapAuthErrorMessage(error.message),
      rateLimited: isEmailRateLimitError(error.message),
    };
  }
  return { success: true, message: 'Confirmation email sent. Check your inbox.' };
}
