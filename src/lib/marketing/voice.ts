import { AI_EMPLOYEE_NAME, APP_NAME } from '@/lib/constants';

/** Shared marketing voice: first AI employee positioning */
export const FIRST_AI_EMPLOYEE_LINE = `Your first AI employee for client work`;

export const AI_EMPLOYEE_GROWTH_LINE =
  'UpperDeck keeps shipping new integrations, workflows, and skills that make your AI employee more capable over time.';

export function sunnyPitch(short = false): string {
  if (short) {
    return `${AI_EMPLOYEE_NAME} is your first AI employee with full context on every client project, with citations back to your files.`;
  }
  return `${AI_EMPLOYEE_NAME} is your first AI employee inside ${APP_NAME}. Not a blank chat window, but a teammate that has read every meeting, deck, email, and note in the project, and gets more powerful as we add features.`;
}
