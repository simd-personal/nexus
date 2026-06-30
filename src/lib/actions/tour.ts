'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getProjectsWithStats } from '@/lib/data/queries';
import type { TourStepId } from '@/lib/tour/state';
import {
  shouldShowContinueTourBanner,
  shouldShowTourWelcomePrompt,
  type ProductTourContext,
  type ProductTourProfileState,
} from '@/lib/tour/state';

function mapTourState(profile: Record<string, unknown> | null): ProductTourProfileState {
  return {
    product_tour_prompt_dismissed_at:
      (profile?.product_tour_prompt_dismissed_at as string | null) ?? null,
    product_tour_part1_completed_at:
      (profile?.product_tour_part1_completed_at as string | null) ?? null,
    product_tour_completed_at: (profile?.product_tour_completed_at as string | null) ?? null,
    product_tour_last_step: (profile?.product_tour_last_step as string | null) ?? null,
  };
}

export async function getProductTourBootstrap(): Promise<{
  state: ProductTourProfileState;
  context: ProductTourContext;
  showWelcomePrompt: boolean;
  showContinueBanner: boolean;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, projects] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    getProjectsWithStats(),
  ]);

  const state = mapTourState(profile);
  const context: ProductTourContext = {
    hasProjects: projects.length > 0,
    projectId: projects[0]?.id ?? null,
  };

  return {
    state,
    context,
    showWelcomePrompt: shouldShowTourWelcomePrompt(state),
    showContinueBanner: shouldShowContinueTourBanner(state, context),
  };
}

async function patchTourFields(fields: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('profiles').update(fields).eq('user_id', user.id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath('/', 'layout');
  return { success: true as const };
}

export async function dismissProductTourPrompt() {
  return patchTourFields({ product_tour_prompt_dismissed_at: new Date().toISOString() });
}

export async function saveProductTourProgress(input: {
  stepId: TourStepId;
  part1Completed?: boolean;
  completed?: boolean;
}) {
  const fields: Record<string, unknown> = {
    product_tour_last_step: input.stepId,
  };
  if (input.part1Completed) {
    fields.product_tour_part1_completed_at = new Date().toISOString();
  }
  if (input.completed) {
    fields.product_tour_completed_at = new Date().toISOString();
  }
  return patchTourFields(fields);
}

export async function resetProductTourForReplay() {
  return patchTourFields({
    product_tour_completed_at: null,
    product_tour_part1_completed_at: null,
    product_tour_last_step: null,
  });
}

export async function startProductTourFromSettings() {
  const result = await resetProductTourForReplay();
  if (result.error) return result;
  return { success: true as const, start: true as const };
}
