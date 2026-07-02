import Stripe from 'stripe';
import { recordDeletedAccount } from '@/lib/auth/deleted-accounts';
import { countUserChatMessagesThisMonth } from '@/lib/billing/limits';
import {
  FREE_CHAT_MESSAGES_PER_MONTH,
  FREE_PROJECT_LIMIT,
  isPaidPlan,
} from '@/lib/billing/plans';
import { createServiceClient } from '@/lib/supabase/admin';
import { deleteProjectAndFiles } from '@/lib/projects/delete-project';
import { getStripe } from '@/lib/stripe/client';

export interface DeleteAccountResult {
  error?: string;
  status?: number;
}

function isStripeResourceMissing(error: unknown): boolean {
  return error instanceof Stripe.errors.StripeError && error.code === 'resource_missing';
}

/**
 * Permanently deletes a user account: cancels + deletes the Stripe customer,
 * removes project files from storage, then deletes the auth user (DB rows
 * cascade from auth.users). Stripe teardown runs first and aborts the whole
 * operation on failure so we never orphan an active paid subscription.
 */
export async function deleteUserAccount(userId: string): Promise<DeleteAccountResult> {
  const admin = createServiceClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('account_type, stripe_customer_id, stripe_subscription_id, plan, subscription_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    return { error: 'Could not load your account.', status: 500 };
  }

  if (profile?.account_type === 'enterprise') {
    return {
      error:
        'Enterprise accounts are managed by our team. Contact support to close your organization account.',
      status: 403,
    };
  }

  if (profile?.stripe_customer_id) {
    try {
      if (profile.stripe_subscription_id) {
        try {
          await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
        } catch (error) {
          if (!isStripeResourceMissing(error)) throw error;
        }
      }
      try {
        // Deleting the customer also removes saved payment methods and
        // cancels any remaining subscriptions.
        await getStripe().customers.del(profile.stripe_customer_id);
      } catch (error) {
        if (!isStripeResourceMissing(error)) throw error;
      }
    } catch (error) {
      console.error('Account deletion: Stripe teardown failed:', error);
      return {
        error: 'Could not cancel your subscription. Try again or contact support.',
        status: 502,
      };
    }
  }

  // Remove storage objects per project — DB cascades don't touch storage.
  const { data: projects, error: projectsError } = await admin
    .from('projects')
    .select('id')
    .eq('owner_id', userId);

  if (projectsError) {
    return { error: 'Could not remove your projects.', status: 500 };
  }

  // Snapshot email + free-quota usage before rows disappear, so free accounts
  // that consumed their quota can't delete-and-recreate to reset limits.
  const { data: userLookup } = await admin.auth.admin.getUserById(userId);
  const email = userLookup?.user?.email ?? null;
  const wasPaid = isPaidPlan(profile?.plan) || Boolean(profile?.subscription_status);
  let hitFreeLimit = (projects?.length ?? 0) >= FREE_PROJECT_LIMIT;
  if (!wasPaid && !hitFreeLimit) {
    const chatMessagesUsed = await countUserChatMessagesThisMonth(userId, admin).catch(() => 0);
    hitFreeLimit = chatMessagesUsed >= FREE_CHAT_MESSAGES_PER_MONTH;
  }

  for (const project of projects ?? []) {
    const result = await deleteProjectAndFiles(admin, project.id, userId);
    if (result.error) {
      // DB rows still cascade below; log the storage leftovers and continue.
      console.error(
        `Account deletion: project ${project.id} cleanup failed: ${result.error}`
      );
    }
  }

  // files.uploaded_by has no ON DELETE action; clear any remaining references
  // (e.g. files shared into another user's project) so the user delete
  // doesn't hit a foreign-key violation.
  const { error: uploadedByError } = await admin
    .from('files')
    .update({ uploaded_by: null })
    .eq('uploaded_by', userId);

  if (uploadedByError) {
    console.error('Account deletion: could not clear file references:', uploadedByError.message);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('Account deletion: auth user delete failed:', deleteError.message);
    return { error: 'Could not delete your account. Contact support.', status: 500 };
  }

  if (email) {
    await recordDeletedAccount({ email, wasPaid, hitFreeLimit });
  }

  return {};
}
