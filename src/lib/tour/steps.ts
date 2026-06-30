import type { ProductTourContext, TourStepId } from '@/lib/tour/state';

export type TourPart = 1 | 2;

export type TourStep = {
  id: TourStepId;
  part: TourPart;
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
    part: 1,
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    title: 'Meet Sunny',
    body: "I'm your AI employee inside UpperDeck. I read meetings, emails, decks, and trackers so you can skip the archaeology phase.",
    sunnyQuip: 'Spoiler: I do the boring parts.',
  },
  {
    id: 'nav-dashboard',
    part: 1,
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    target: 'nav-dashboard',
    title: 'Executive Dashboard',
    body: 'Start here. See what needs attention — critical items, action items, and Sunny updates in one place.',
  },
  {
    id: 'nav-projects',
    part: 1,
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    target: 'nav-projects',
    title: 'Projects',
    body: 'One workspace per client or program. Upload materials, ask questions, and generate briefs from everything in that project.',
  },
  {
    id: 'nav-updates',
    part: 1,
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    target: 'nav-updates',
    title: 'Sunny Updates',
    body: 'What changed since you last looked — including when someone replaces a living doc and I summarize the diff.',
  },
  {
    id: 'nav-sunny-search',
    part: 1,
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    target: 'nav-sunny',
    title: 'Ask Sunny & Search',
    body: 'Ask plain-English questions with citations, or search across all project files. No Ctrl+F treasure hunts.',
  },
  {
    id: 'create-project',
    part: 1,
    route: '/getting-started',
    target: 'create-project',
    title: 'Create your first project',
    body: 'Set up a client project here, then upload a meeting note or tracker. Sunny indexes in the background while you keep working.',
    skipIf: (ctx) => ctx.hasProjects,
  },
  {
    id: 'part1-complete',
    part: 1,
    route: (ctx) => (ctx.hasProjects ? '/dashboard' : '/getting-started'),
    title: 'Part one done',
    body: 'If you already have a project, continue for files, replace tips, and brief generation. Otherwise create one first — then hit Continue tour.',
    sunnyQuip: 'Part two is where it gets fun. I promise.',
  },
  {
    id: 'project-overview',
    part: 2,
    route: (ctx) => `/projects/${ctx.projectId}/overview`,
    target: 'project-overview',
    title: 'Project overview',
    body: 'Sunny summary, open action items, and critical flags — your weekly stand-up in one screen.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'project-files',
    part: 2,
    route: (ctx) => `/projects/${ctx.projectId}/files`,
    target: 'project-files',
    title: 'Files workspace',
    body: 'Drop uploads, paste emails, forward from Outlook. Sunny chunks and indexes everything for search and chat.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'project-replace-tip',
    part: 2,
    route: (ctx) => `/projects/${ctx.projectId}/files`,
    target: 'file-replace-tip',
    title: 'Pro tip: Replace, do not stack',
    body: 'Living doc updated in SharePoint? Use Replace file — I diff what changed and save a summary on the Changes tab.',
    sunnyQuip: 'Magic. Mostly.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'project-ask-sunny',
    part: 2,
    route: (ctx) => `/projects/${ctx.projectId}/ask-sunny`,
    target: 'project-ask-sunny',
    title: 'Ask Sunny',
    body: 'Try “What changed this week?” or “Who owns the migration?” — answers come with evidence from your files.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'project-generate',
    part: 2,
    route: (ctx) => `/projects/${ctx.projectId}/follow-up`,
    target: 'project-generate',
    title: 'Generate outputs',
    body: 'Turn project context into a follow-up email, brief, deck, or playbook — grounded in uploads, not generic fluff.',
    skipIf: (ctx) => !ctx.projectId,
  },
  {
    id: 'nav-action-items',
    part: 2,
    route: '/dashboard',
    target: 'nav-action-items',
    title: 'Action & critical items',
    body: 'Sunny surfaces follow-ups and risks across projects. Mark items done as you go.',
  },
  {
    id: 'finish',
    part: 2,
    route: '/dashboard',
    title: 'You are dangerous now',
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

export function getTourStepsForPart(part: TourPart, ctx: ProductTourContext): TourStep[] {
  return TOUR_STEPS.filter((step) => step.part === part && !(step.skipIf?.(ctx) ?? false));
}

export function getAllTourSteps(ctx: ProductTourContext): TourStep[] {
  const part1 = getTourStepsForPart(1, ctx);
  const part2 = getTourStepsForPart(2, ctx);
  if (!ctx.projectId) return part1;
  return [...part1, ...part2];
}

export function getNextStepId(
  currentId: TourStepId | null,
  ctx: ProductTourContext,
  part: TourPart
): TourStepId | null {
  const steps = part === 1 ? getTourStepsForPart(1, ctx) : getAllTourSteps(ctx);
  if (!currentId) return steps[0]?.id ?? null;
  const index = steps.findIndex((step) => step.id === currentId);
  if (index < 0) return steps[0]?.id ?? null;
  return steps[index + 1]?.id ?? null;
}

export function getStepById(id: TourStepId): TourStep | undefined {
  return TOUR_STEPS.find((step) => step.id === id);
}

export function getStepIndex(id: TourStepId, ctx: ProductTourContext, part: TourPart): number {
  const steps = part === 1 ? getTourStepsForPart(1, ctx) : getAllTourSteps(ctx);
  return steps.findIndex((step) => step.id === id);
}

export function getStepCount(ctx: ProductTourContext, part: TourPart): number {
  return part === 1 ? getTourStepsForPart(1, ctx).length : getAllTourSteps(ctx).length;
}
