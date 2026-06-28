import { createClient } from '@/lib/supabase/server';
import { FREE_CHAT_MESSAGES_PER_MONTH, FREE_PROJECT_LIMIT } from '@/lib/billing/plans';
import { hasProAccess } from '@/lib/billing/test-accounts';

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
    chatMessageLimit: isPro ? null : FREE_CHAT_MESSAGES_PER_MONTH,
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
