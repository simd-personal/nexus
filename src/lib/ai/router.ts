/**
 * AI routing policy for BriefNexus:
 * - OpenAI (GPT-5.5): search, Q&A, embeddings, extraction, critical detection
 * - Claude (Opus 4.8): long-form generation — briefs, decks, playbooks, emails, project setup
 */

export const AI_ROUTING = {
  search: 'openai',
  askSunny: 'openai',
  embeddings: 'openai',
  extraction: 'openai',
  criticalDetection: 'openai',
  generation: 'claude',
  projectSetup: 'claude',
} as const;
