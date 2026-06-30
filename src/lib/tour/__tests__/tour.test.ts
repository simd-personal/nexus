import { describe, expect, it } from 'vitest';
import { getActiveTourSteps } from '@/lib/tour/steps';
import {
  shouldShowContinueTourBanner,
  shouldShowTourWelcomePrompt,
  type ProductTourProfileState,
} from '@/lib/tour/state';

const emptyState: ProductTourProfileState = {
  product_tour_prompt_dismissed_at: null,
  product_tour_part1_completed_at: null,
  product_tour_completed_at: null,
  product_tour_last_step: null,
};

describe('product tour state', () => {
  it('never auto-shows welcome prompt', () => {
    expect(shouldShowTourWelcomePrompt(emptyState)).toBe(false);
    expect(
      shouldShowTourWelcomePrompt({
        ...emptyState,
        product_tour_completed_at: null,
        product_tour_prompt_dismissed_at: null,
      })
    ).toBe(false);
  });

  it('never auto-shows continue banner', () => {
    expect(
      shouldShowContinueTourBanner(
        {
          ...emptyState,
          product_tour_part1_completed_at: new Date().toISOString(),
        },
        { hasProjects: true, projectId: 'proj-1' }
      )
    ).toBe(false);
  });
});

describe('product tour steps', () => {
  it('skips create-project when projects already exist', () => {
    const steps = getActiveTourSteps({ hasProjects: true, projectId: 'p1' });
    expect(steps.some((step) => step.id === 'create-project')).toBe(false);
  });

  it('includes replace tip and caps at five steps for users with a project', () => {
    const steps = getActiveTourSteps({ hasProjects: true, projectId: 'p1' });
    expect(steps.some((step) => step.id === 'project-replace-tip')).toBe(true);
    expect(steps.some((step) => step.id === 'finish')).toBe(true);
    expect(steps.length).toBeLessThanOrEqual(5);
  });
});
