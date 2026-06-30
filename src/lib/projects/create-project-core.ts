import type { SupabaseClient, User } from '@supabase/supabase-js';
import { countUserProjects, getBillingContextForUser } from '@/lib/billing/limits';
import { parseProjectPortfolio } from '@/lib/projects/portfolio';
import type { Project } from '@/types/database';

export type CreateProjectInput = {
  clientName: string;
  projectName: string;
  description?: string | null;
  sunnyNotes?: string | null;
  parentProjectId?: string | null;
  portfolio?: string | null;
};

export type CreateProjectResult =
  | { data: Project; error?: undefined; upgradeRequired?: undefined }
  | { error: string; upgradeRequired?: boolean; data?: undefined };

export async function createProjectForUser(
  supabase: SupabaseClient,
  user: User,
  input: CreateProjectInput
): Promise<CreateProjectResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_organization_id, account_type')
    .eq('user_id', user.id)
    .single();

  let organizationId: string | null = null;
  if (profile?.default_organization_id && profile.account_type === 'enterprise') {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', profile.default_organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership) {
      organizationId = profile.default_organization_id;
    }
  }

  const clientName = input.clientName.trim();
  const projectName = input.projectName.trim();
  const parentProjectId = input.parentProjectId?.trim() || null;
  let portfolio = parseProjectPortfolio(input.portfolio ?? null);

  if (!clientName || !projectName) {
    return { error: 'Client name and project name are required' };
  }

  let resolvedParentId: string | null = null;
  if (parentProjectId) {
    const { data: parent } = await supabase
      .from('projects')
      .select('id, owner_id, parent_project_id, client_name, portfolio')
      .eq('id', parentProjectId)
      .single();

    if (!parent || parent.owner_id !== user.id) {
      return { error: 'Parent program not found' };
    }
    if (parent.parent_project_id) {
      return { error: 'Workstreams can only be added under a standalone program project' };
    }
    resolvedParentId = parent.id;
    portfolio = parseProjectPortfolio(parent.portfolio);
  }

  const billing = await getBillingContextForUser(user.id);
  if (!billing.isPro && billing.projectLimit !== null) {
    const projectCount = await countUserProjects(user.id);
    if (projectCount >= billing.projectLimit) {
      return {
        error: 'Free plan includes 1 active project. Upgrade to Pro for unlimited projects.',
        upgradeRequired: true,
      };
    }
  }

  const trimmedDescription = input.description?.trim() || null;
  const trimmedNotes = input.sunnyNotes?.trim() || null;
  const projectDescription = trimmedDescription ?? (trimmedNotes ? trimmedNotes : null);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      organization_id: organizationId,
      parent_project_id: resolvedParentId,
      client_name: clientName,
      project_name: projectName,
      description: projectDescription,
      last_summary: null,
      portfolio,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export function createProjectInputFromFormData(formData: FormData): CreateProjectInput {
  return {
    clientName: String(formData.get('client_name') ?? ''),
    projectName: String(formData.get('project_name') ?? ''),
    description: (formData.get('description') as string | null) ?? null,
    sunnyNotes: (formData.get('sunny_notes') as string | null) ?? null,
    parentProjectId: (formData.get('parent_project_id') as string | null) ?? null,
    portfolio: (formData.get('portfolio') as string | null) ?? null,
  };
}
