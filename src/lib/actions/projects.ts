'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { deleteProjectAndFiles } from '@/lib/projects/delete-project';
import { countUserProjects, getBillingContextForUser } from '@/lib/billing/limits';
import type { ActionItemStatus, ProjectStatus } from '@/types/database';
import { parseKeywordList } from '@/lib/relevance/watchlist';
import { parseProjectPortfolio, type DashboardPortfolioScope } from '@/lib/projects/portfolio';
import { recomputeProjectStatus } from '@/lib/projects/health';

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

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

  const clientName = formData.get('client_name') as string;
  const projectName = formData.get('project_name') as string;
  const description = formData.get('description') as string;
  const sunnyNotes = formData.get('sunny_notes') as string;
  const parentProjectId = (formData.get('parent_project_id') as string)?.trim() || null;
  const portfolioInput = parseProjectPortfolio(formData.get('portfolio') as string);

  if (!clientName?.trim() || !projectName?.trim()) {
    return { error: 'Client name and project name are required' };
  }

  let resolvedParentId: string | null = null;
  let portfolio = portfolioInput;
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
        error:
          'Free plan includes 1 active project. Upgrade to Pro for unlimited projects.',
        upgradeRequired: true,
      };
    }
  }

  const trimmedDescription = description?.trim() || null;
  const trimmedNotes = sunnyNotes?.trim() || null;
  const projectDescription =
    trimmedDescription ??
    (trimmedNotes ? trimmedNotes : null);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      organization_id: organizationId,
      parent_project_id: resolvedParentId,
      client_name: clientName.trim(),
      project_name: projectName.trim(),
      description: projectDescription,
      last_summary: null,
      portfolio,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  if (resolvedParentId) revalidatePath(`/projects/${resolvedParentId}/overview`);
  return { data };
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateCriticalItemStatus(
  itemId: string,
  status: 'open' | 'acknowledged' | 'resolved'
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('critical_items')
    .update({ status })
    .eq('id', itemId)
    .select('project_id')
    .single();

  if (error) return { error: error.message };
  if (data?.project_id) {
    await recomputeProjectStatus(supabase, data.project_id);
  }
  revalidatePath('/critical-items');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
  return { success: true };
}

export async function updateActionItemStatus(
  itemId: string,
  status: ActionItemStatus,
  options?: { applies_to_me?: boolean }
) {
  const supabase = await createClient();
  const updates: { status: ActionItemStatus; applies_to_me?: boolean } = { status };
  if (options?.applies_to_me !== undefined) {
    updates.applies_to_me = options.applies_to_me;
  }

  const { data, error } = await supabase
    .from('action_items')
    .update(updates)
    .eq('id', itemId)
    .select('project_id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/action-items');
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}/overview`);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const result = await deleteProjectAndFiles(supabase, projectId, user.id);
  if (result.error) return { error: result.error };
  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  return { success: true, deletedFiles: result.deletedFiles ?? 0 };
}

export type SettingsFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function updateProfile(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const user = await requireUser();
  const supabase = await createClient();
  const fullName = formData.get('full_name') as string;
  const companyName = (formData.get('company_name') as string)?.trim() || null;
  const nameAliases = parseKeywordList(formData.get('name_aliases') as string);
  const watchKeywords = parseKeywordList(formData.get('watch_keywords') as string);

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName?.trim() || null,
      company_name: companyName,
      name_aliases: nameAliases,
      watch_keywords: watchKeywords,
    })
    .eq('user_id', user.id);

  if (error) {
    return { status: 'error', message: 'Could not save your profile. Please try again.' };
  }

  revalidatePath('/settings');
  return { status: 'success', message: 'Profile saved.' };
}

export async function updateProjectRelevance(
  projectId: string,
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireUser();
  const supabase = await createClient();
  const watchKeywords = parseKeywordList(formData.get('watch_keywords') as string);
  const myRole = (formData.get('my_role') as string)?.trim() || null;

  const { error } = await supabase
    .from('projects')
    .update({
      watch_keywords: watchKeywords,
      my_role: myRole,
    })
    .eq('id', projectId);

  if (error) {
    return { status: 'error', message: 'Could not save relevance settings. Please try again.' };
  }

  revalidatePath(`/projects/${projectId}/overview`);
  return { status: 'success', message: 'Relevance settings saved.' };
}

export async function updateProjectPortfolio(
  projectId: string,
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireUser();
  const supabase = await createClient();
  const portfolio = parseProjectPortfolio(formData.get('portfolio') as string);

  const { data: project } = await supabase
    .from('projects')
    .select('id, parent_project_id')
    .eq('id', projectId)
    .single();

  if (!project) {
    return { status: 'error', message: 'Project not found.' };
  }
  if (project.parent_project_id) {
    return { status: 'error', message: 'Change portfolio on the parent program project.' };
  }

  const { error } = await supabase.from('projects').update({ portfolio }).eq('id', projectId);
  if (error) {
    return { status: 'error', message: 'Could not save portfolio. Please try again.' };
  }

  await supabase
    .from('projects')
    .update({ portfolio })
    .eq('parent_project_id', projectId);

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath('/updates');
  revalidatePath('/critical-items');
  revalidatePath('/action-items');
  revalidatePath(`/projects/${projectId}/overview`);
  return { status: 'success', message: 'Portfolio saved.' };
}

export async function setDashboardPortfolio(scope: DashboardPortfolioScope) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ dashboard_portfolio: scope })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/updates');
  revalidatePath('/critical-items');
  revalidatePath('/action-items');
  revalidatePath('/settings');
  return { success: true };
}

export async function updateDashboardPortfolioPreference(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const scope = formData.get('dashboard_portfolio');
  if (scope !== 'work' && scope !== 'personal' && scope !== 'all') {
    return { status: 'error', message: 'Choose a valid dashboard scope.' };
  }

  const result = await setDashboardPortfolio(scope);
  if (result.error) {
    return { status: 'error', message: 'Could not save preference. Please try again.' };
  }

  return { status: 'success', message: 'Default dashboard scope saved.' };
}
