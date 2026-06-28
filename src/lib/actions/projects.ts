'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { deleteProjectAndFiles } from '@/lib/projects/delete-project';
import { enrichProjectSetup } from '@/lib/ai/sunny';
import { countUserProjects, getBillingContextForUser } from '@/lib/billing/limits';
import type { ProjectStatus } from '@/types/database';

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_organization_id')
    .eq('user_id', user.id)
    .single();

  const clientName = formData.get('client_name') as string;
  const projectName = formData.get('project_name') as string;
  const description = formData.get('description') as string;
  const sunnyNotes = formData.get('sunny_notes') as string;
  const parentProjectId = (formData.get('parent_project_id') as string)?.trim() || null;

  if (!clientName?.trim() || !projectName?.trim()) {
    return { error: 'Client name and project name are required' };
  }

  let resolvedParentId: string | null = null;
  if (parentProjectId) {
    const { data: parent } = await supabase
      .from('projects')
      .select('id, owner_id, parent_project_id, client_name')
      .eq('id', parentProjectId)
      .single();

    if (!parent || parent.owner_id !== user.id) {
      return { error: 'Parent program not found' };
    }
    if (parent.parent_project_id) {
      return { error: 'Workstreams can only be added under a top-level program project' };
    }
    resolvedParentId = parent.id;
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

  let enrichedDescription = description?.trim() || null;
  let initialSummary: string | null = null;

  try {
    const enriched = await enrichProjectSetup({
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      description: description?.trim(),
      userNotes: sunnyNotes?.trim(),
    });
    enrichedDescription = enriched.description || enrichedDescription;
    initialSummary = enriched.initial_summary || null;
  } catch {
    // GPT enrichment is optional — project still creates without it
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      organization_id: profile?.default_organization_id ?? null,
      parent_project_id: resolvedParentId,
      client_name: clientName.trim(),
      project_name: projectName.trim(),
      description: enrichedDescription,
      last_summary: initialSummary,
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
  revalidatePath('/critical-items');
  if (data?.project_id) revalidatePath(`/projects/${data.project_id}`);
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

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const fullName = formData.get('full_name') as string;

  await supabase
    .from('profiles')
    .update({ full_name: fullName?.trim() })
    .eq('user_id', user.id);

  revalidatePath('/settings');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import('next/navigation');
  redirect('/login');
}
