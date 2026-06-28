'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { deleteProjectAndFiles } from '@/lib/projects/delete-project';
import { enrichProjectSetup } from '@/lib/ai/sunny';
import type { ProjectStatus } from '@/types/database';

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const clientName = formData.get('client_name') as string;
  const projectName = formData.get('project_name') as string;
  const description = formData.get('description') as string;
  const sunnyNotes = formData.get('sunny_notes') as string;

  if (!clientName?.trim() || !projectName?.trim()) {
    return { error: 'Client name and project name are required' };
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
