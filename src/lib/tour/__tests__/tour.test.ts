import { describe, expect, it } from 'vitest';
import { getAllTourSteps, getTourStepsForPart } from '@/lib/tour/steps';
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
  it('shows welcome prompt for new users', () => {
    expect(shouldShowTourWelcomePrompt(emptyState)).toBe(true);
  });

  it('hides welcome prompt after dismiss or completion', () => {
    expect(
      shouldShowTourWelcomePrompt({
        ...emptyState,
        product_tour_prompt_dismissed_at: new Date().toISOString(),
      })
    ).toBe(false);
    expect(
      shouldShowTourWelcomePrompt({
        ...emptyState,
        product_tour_completed_at: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it('shows continue banner after part one when user has a project', () => {
    expect(
      shouldShowContinueTourBanner(
        {
          ...emptyState,
          product_tour_part1_completed_at: new Date().toISOString(),
        },
        { hasProjects: true, projectId: 'proj-1' }
      )
    ).toBe(true);
  });
});

describe('product tour steps', () => {
  it('skips create-project when projects already exist', () => {
    const steps = getTourStepsForPart(1, { hasProjects: true, projectId: 'p1' });
    expect(steps.some((step) => step.id === 'create-project')).toBe(false);
  });

  it('includes part two project steps when project id is available', () => {
    const steps = getAllTourSteps({ hasProjects: true, projectId: 'p1' });
    expect(steps.some((step) => step.id === 'project-replace-tip')).toBe(true);
    expect(steps.some((step) => step.id === 'finish')).toBe(true);
  });
});
