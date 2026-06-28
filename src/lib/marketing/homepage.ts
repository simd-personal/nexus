import { AI_EMPLOYEE_NAME } from '@/lib/constants';

export const HOME_AUDIENCES = [
  {
    title: 'Solo consultants',
    body: 'Juggling a few clients? Keep each engagement separate — decks, emails, and calls in one place per project.',
  },
  {
    title: 'Fractional executives',
    body: 'Chiefs of staff and fractional COOs who need the full picture before every stakeholder conversation.',
  },
  {
    title: 'Small agency leads',
    body: 'Delivery teams that outgrow shared drives and Slack threads but are not ready for enterprise software.',
  },
] as const;

export const HOME_WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Upload client work',
    body: 'Meetings, emails, decks, PDFs, audio, and notes — one project per client engagement.',
  },
  {
    step: '02',
    title: `${AI_EMPLOYEE_NAME} reads it all`,
    body: 'Briefs, risks, contradictions, and follow-ups surface automatically from your real files.',
  },
  {
    step: '03',
    title: 'Show up prepared',
    body: 'Ask questions, draft emails, build decks, and catch critical items before your client does.',
  },
] as const;

export const HOME_AI_POINTS = [
  'GPT and Claude — we route to the best model for each job',
  'No ChatGPT Plus or Claude Pro subscription required',
  'AI usage included in your UpperDeck plan',
  'Answers cite your uploads — not made-up client facts',
] as const;

export const HOME_COMPARISONS = [
  {
    label: 'Generic AI chat',
    examples: 'ChatGPT, Claude',
    body: 'A blank chat forgets your client. UpperDeck remembers every deck, email, and meeting — with citations.',
  },
  {
    label: 'Project management',
    examples: 'Asana, Monday',
    body: 'Tasks are not context. UpperDeck is built for client intelligence — what changed, what is at risk, what to say next.',
  },
  {
    label: 'Meeting notes only',
    examples: 'Fireflies, Granola',
    body: 'Transcripts are one input. UpperDeck is the command center across files, timelines, and decisions.',
  },
] as const;
