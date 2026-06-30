import type { ProductTourContext, TourStepId } from '@/lib/tour/state';

export type TourStep = {
  id: TourStepId;
  route: string | ((ctx: ProductTourContext) => string);
  target?: string;
  title: string;
  body: string;
  sunnyQuip?: string;
  skipIf?: (ctx: ProductTourContext) => boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    title: 'Meet Sunny',
    body: "I'm your AI employee inside UpperDeck. I read meetings, emails, decks, and trackers so you can skip the archaeology phase.",
    sunnyQuip: 'Spoiler: I do the boring parts.',
  },
  {
    id: 'nav-projects',
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    target: 'nav-projects',
    title: 'Projects',
    body: 'One workspace per client or program. Upload materials, ask questions, and generate briefs from everything in that project.',
  },
  {
    id: 'create-project',
    route: '/getting-started',
    target: 'create-project',
    title: 'Create your first project',
    body: 'Set up a client project here, then upload a meeting note or tracker. Sunny indexes in the background while you keep working.',
    skipIf: (ctx) => ctx.hasProjects,
  },
  {
    id: 'project-files',
    route: (ctx) => `/projects/${ctx.projectId}/files`,
    target: 'project-files',
    title: 'Files workspace',
    body: 'Drop uploads, paste emails, or forward from Outlook. Sunny chunks and indexes everything for search and chat.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'project-replace-tip',
    route: (ctx) => `/projects/${ctx.projectId}/files`,
    target: 'file-replace-tip',
    title: 'Pro tip: Replace, do not stack',
    body: 'Living doc updated in SharePoint? Use Replace file — I diff what changed and save a summary on the Changes tab.',
    sunnyQuip: 'Magic. Mostly.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'finish',
    route: '/dashboard',
    title: 'You are all set',
    body: 'Replay this tour anytime from Settings. Upload messy stuff — that is literally my job.',
    sunnyQuip: 'Go break something. I will summarize it.',
  },
];

export function resolveTourRoute(step: TourStep, ctx: ProductTourContext): string {
  const route = typeof step.route === 'function' ? step.route(ctx) : step.route;
  if (!route || route.includes('undefined') || route.includes('null')) {
    return '/dashboard';
  }
  return route;
}

export function getActiveTourSteps(ctx: ProductTourContext): TourStep[] {
  return TOUR_STEPS.filter((step) => !(step.skipIf?.(ctx) ?? false));
}

/** @deprecated Use getActiveTourSteps */
export function getAllTourSteps(ctx: ProductTourContext): TourStep[] {
  return getActiveTourSteps(ctx);
}

export function getStepById(id: TourStepId): TourStep | undefined {
  return TOUR_STEPS.find((step) => step.id === id);
}

export function getStepIndex(id: TourStepId, ctx: ProductTourContext): number {
  return getActiveTourSteps(ctx).findIndex((step) => step.id === id);
}

export function getStepCount(ctx: ProductTourContext): number {
  return getActiveTourSteps(ctx).length;
}
