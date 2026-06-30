export type TourStepId =
  | 'welcome'
  | 'nav-dashboard'
  | 'nav-projects'
  | 'nav-updates'
  | 'nav-sunny-search'
  | 'create-project'
  | 'part1-complete'
  | 'project-overview'
  | 'project-files'
  | 'project-replace-tip'
  | 'project-ask-sunny'
  | 'project-generate'
  | 'nav-action-items'
  | 'finish';

export type TourPart = 1 | 2;

export type ProductTourProfileState = {
  product_tour_prompt_dismissed_at: string | null;
  product_tour_part1_completed_at: string | null;
  product_tour_completed_at: string | null;
  product_tour_last_step: string | null;
};

export type ProductTourContext = {
  hasProjects: boolean;
  projectId: string | null;
};

export function shouldShowTourWelcomePrompt(state: ProductTourProfileState): boolean {
  if (state.product_tour_completed_at) return false;
  if (state.product_tour_prompt_dismissed_at) return false;
  return true;
}

export function shouldShowContinueTourBanner(
  state: ProductTourProfileState,
  context: ProductTourContext
): boolean {
  if (state.product_tour_completed_at) return false;
  if (!state.product_tour_part1_completed_at) return false;
  if (!context.hasProjects) return false;
  return true;
}
