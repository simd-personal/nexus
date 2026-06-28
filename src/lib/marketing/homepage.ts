import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export const HOME_AUDIENCES = [
  {
    title: 'Solo consultants',
    body: 'Your first AI employee on client number one — then hire more capacity as your book of business grows.',
  },
  {
    title: 'Fractional executives',
    body: 'A chief-of-staff-level AI employee who has read every stakeholder email, deck, and meeting.',
  },
  {
    title: 'Small agency leads',
    body: 'Give every delivery lead an AI employee with shared client context — before you need enterprise software.',
  },
] as const;

export const HOME_WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Onboard your AI employee',
    body: `Create a project per client and upload meetings, decks, emails, and notes — ${AI_EMPLOYEE_NAME}'s workspace.`,
  },
  {
    step: '02',
    title: `${AI_EMPLOYEE_NAME} does the reading`,
    body: 'Briefs, risks, contradictions, and follow-ups surface from your real files — not a blank prompt.',
  },
  {
    step: '03',
    title: 'Show up prepared',
    body: 'Ask questions, draft emails, build decks, and catch issues before your client does.',
  },
] as const;

export const HOME_AI_POINTS = [
  'Latest GPT and Claude models — routed automatically, included in your plan',
  'No separate ChatGPT Plus or Claude Pro subscription',
  'Your AI employee cites uploads — not invented client facts',
  'New skills and integrations added over time — your employee gets sharper',
] as const;

export const HOME_COMPARISONS = [
  {
    label: 'Generic AI chat',
    examples: 'ChatGPT, Claude',
    body: 'A chat tab has no memory of your client. An AI employee lives inside every project — with citations.',
  },
  {
    label: 'Project management',
    examples: 'Asana, Monday',
    body: 'Tasks are not context. Your AI employee tracks what changed, what is at risk, and what to say next.',
  },
  {
    label: 'Meeting notes only',
    examples: 'Fireflies, Granola',
    body: 'Transcripts are one input. Your AI employee works across decks, emails, timelines, and decisions.',
  },
] as const;
