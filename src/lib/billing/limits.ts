import { createClient } from '@/lib/supabase/server';
import {
  FREE_CHAT_MESSAGES_PER_MONTH,
  FREE_PROJECT_LIMIT,
  PRO_CHAT_MESSAGES_PER_MONTH,
} from '@/lib/billing/plans';
import { hasProAccess } from '@/lib/billing/test-accounts';

export type BillingContext = Awaited<ReturnType<typeof getBillingContextForUser>>;

export async function getBillingContextForUser(userId: string) {
  const supabase = await createClient();
  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, subscription_status, account_type')
      .eq('user_id', userId)
      .single(),
    supabase.auth.getUser(),
  ]);

  const email = user?.id === userId ? user.email : null;
  const isEnterprise = profile?.account_type === 'enterprise';
  const isPro = hasProAccess({
    plan: profile?.plan,
    subscriptionStatus: profile?.subscription_status,
    accountType: profile?.account_type,
    email,
  });

  return {
    profile,
    isEnterprise,
    isPro,
    projectLimit: isPro ? null : FREE_PROJECT_LIMIT,
    chatMessageLimit: isPro ? PRO_CHAT_MESSAGES_PER_MONTH : FREE_CHAT_MESSAGES_PER_MONTH,
  };
}

export async function countUserProjects(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);

  return count ?? 0;
}

/**
 * Shared gate for Sunny chat/search/generate. Returns whether the free monthly
 * message quota is exhausted, plus a user-facing message with an upgrade link
 * (rendered as markdown in the chat bubble).
 */
export async function checkChatQuota(
  userId: string,
  billing?: BillingContext
): Promise<{ exceeded: boolean; message: string }> {
  const ctx = billing ?? (await getBillingContextForUser(userId));
  if (ctx.chatMessageLimit === null) {
    return { exceeded: false, message: '' };
  }

  const used = await countUserChatMessagesThisMonth(userId);
  if (used >= ctx.chatMessageLimit) {
    const message = ctx.isPro
      ? `You've reached the ${ctx.chatMessageLimit} Sunny messages included this month on Pro. Your limit resets on the 1st — contact support if you need a higher cap for your team.`
      : `You've used all ${ctx.chatMessageLimit} free Sunny messages this month. [Upgrade to Pro](/upgrade?plan=pro) for more chat and projects.`;
    return { exceeded: true, message };
  }

  return { exceeded: false, message: '' };
}

export async function countUserChatMessagesThisMonth(userId: string): Promise<number> {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', userId);

  const projectIds = (projects ?? []).map((project) => project.id);
  if (projectIds.length === 0) return 0;

  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .in('project_id', projectIds)
    .eq('role', 'user')
    .gte('created_at', startOfMonth.toISOString());

  return count ?? 0;
}
