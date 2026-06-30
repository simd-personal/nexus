export type TourStepId =
  | 'welcome'
  | 'nav-projects'
  | 'create-project'
  | 'project-files'
  | 'project-replace-tip'
  | 'finish';

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

/** Tour is opt-in only — start from Settings. Never auto-prompt. */
export function shouldShowTourWelcomePrompt(_state: ProductTourProfileState): boolean {
  return false;
}

/** Part-two continuation banner removed — single short tour from Settings. */
export function shouldShowContinueTourBanner(
  _state: ProductTourProfileState,
  _context: ProductTourContext
): boolean {
  return false;
}
