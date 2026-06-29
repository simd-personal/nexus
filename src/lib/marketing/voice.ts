import { AI_EMPLOYEE_NAME, APP_NAME, BRAND_TAGLINE, SUNNY_HERO_LINE, TAGLINE } from '@/lib/constants';

export const EMPLOYEE_POSITIONING_LINE = BRAND_TAGLINE;

export const AI_EMPLOYEE_GROWTH_LINE =
  'UpperDeck keeps shipping new integrations, workflows, and skills that make your AI employee more capable over time.';

export function sunnyPitch(short = false): string {
  if (short) {
    return SUNNY_HERO_LINE;
  }
  return `${SUNNY_HERO_LINE} Inside ${APP_NAME}, ${AI_EMPLOYEE_NAME} reads every meeting, deck, email, and note in the project, with citations back to your files.`;
}

export { TAGLINE as BRAND_SUBLINE };
