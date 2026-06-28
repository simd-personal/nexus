'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { OrganizationIndustry, OrganizationMemberRole } from '@/types/database';

export async function getOrganizationAdminContext() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, default_organization_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.default_organization_id) {
    return { user, profile, organization: null, membership: null, members: [], requests: [] };
  }

  const orgId = profile.default_organization_id;
  const [{ data: organization }, { data: membership }, { data: members }, { data: requests }] =
    await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('organization_members')
        .select('id, organization_id, user_id, role, status, joined_at')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: true }),
      supabase
        .from('organization_access_requests')
        .select('id, user_id, message, status, created_at')
        .eq('organization_id', orgId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

  return {
    user,
    profile,
    organization,
    membership,
    members: members ?? [],
    requests: requests ?? [],
  };
}

async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  actorId: string,
  action: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from('organization_audit_events').insert({
    organization_id: organizationId,
    actor_id: actorId,
    action,
    metadata,
  });
}

export async function reviewAccessRequest(requestId: string, approve: boolean) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from('organization_access_requests')
    .select('id, organization_id, user_id, status')
    .eq('id', requestId)
    .single();

  if (error || !request) return { error: 'Access request not found' };
  if (request.status !== 'pending') return { error: 'Request already reviewed' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', request.organization_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only organization admins can review access requests' };
  }

  const status = approve ? 'approved' : 'denied';
  const { error: updateError } = await supabase
    .from('organization_access_requests')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) return { error: updateError.message };

  if (approve) {
    await supabase.from('organization_members').upsert(
      {
        organization_id: request.organization_id,
        user_id: request.user_id,
        role: 'member',
        status: 'active',
      },
      { onConflict: 'organization_id,user_id' }
    );
  }

  await logAudit(supabase, request.organization_id, user.id, `access_request.${status}`, {
    request_id: requestId,
    user_id: request.user_id,
  });

  revalidatePath('/settings/organization');
  return { success: true };
}

export async function updateMemberRole(memberId: string, role: OrganizationMemberRole) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role')
    .eq('id', memberId)
    .single();

  if (error || !member) return { error: 'Member not found' };
  if (member.user_id === user.id) return { error: 'You cannot change your own role here' };
  if (member.role === 'owner') return { error: 'Cannot change the organization owner role' };

  const { data: actorMembership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', member.organization_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!actorMembership || !['owner', 'admin'].includes(actorMembership.role)) {
    return { error: 'Only organization admins can update roles' };
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId);

  if (updateError) return { error: updateError.message };

  await logAudit(supabase, member.organization_id, user.id, 'member.role_updated', {
    member_id: memberId,
    role,
  });

  revalidatePath('/settings/organization');
  return { success: true };
}

export async function updateOrganizationSettings(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const orgId = formData.get('organization_id') as string;
  const phiProtection = formData.get('phi_protection_enabled') === 'on';

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return;
  }

  const { error } = await supabase
    .from('organizations')
    .update({ phi_protection_enabled: phiProtection })
    .eq('id', orgId);

  if (error) return;

  await logAudit(supabase, orgId, user.id, 'organization.settings_updated', {
    phi_protection_enabled: phiProtection,
  });

  revalidatePath('/settings/organization');
  revalidatePath('/settings');
}

export async function requestOrganizationAccess(organizationId: string, message?: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('organization_access_requests').insert({
    organization_id: organizationId,
    user_id: user.id,
    message: message?.trim() || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}
