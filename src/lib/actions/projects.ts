'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { deleteProjectAndFiles } from '@/lib/projects/delete-project';
import {
  createProjectForUser,
  createProjectInputFromFormData,
} from '@/lib/projects/create-project-core';
import type { ActionItemStatus, ProjectStatus } from '@/types/database';
import { parseKeywordList } from '@/lib/relevance/watchlist';
import { parseProjectPortfolio, type DashboardPortfolioScope } from '@/lib/projects/portfolio';
import { recomputeProjectStatus } from '@/lib/projects/health';

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const input = createProjectInputFromFormData(formData);
  const result = await createProjectForUser(supabase, user, input);

  if (result.error) return result;

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath('/getting-started');
  if (input.parentProjectId) revalidatePath(`/projects/${input.parentProjectId}/overview`);
  return result;
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
