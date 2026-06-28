import type { SeedProjectSpec } from '../lib/seed-helpers';

export const RICH_SEED_PROJECTS: SeedProjectSpec[] = [
  {
    clientName: 'Acme Corp',
    projectName: 'Q3 Business Review',
    description:
      'West region expansion, vendor consolidation, and board prep with Denver, Phoenix, and executive financial modeling.',
    status: 'watch',
    files: [
      {
        fileName: 'acme-q3-executive-sync.vtt',
        fixturePath: 'acme-q3-executive-sync.vtt',
        mimeType: 'text/vtt',
        sourceType: 'transcript',
      },
      {
        fileName: 'acme-q3-board-pack.pdf',
        fixturePath: 'acme-q3-board-pack.pdf',
        mimeType: 'application/pdf',
        sourceType: 'pdf',
      },
      {
        fileName: 'acme-denver-site-visit-notes.txt',
        fixturePath: 'acme-denver-site-visit-notes.txt',
        mimeType: 'text/plain',
        sourceType: 'meeting',
      },
      {
        fileName: 'acme-cfo-email-thread.txt',
        fixturePath: 'acme-cfo-email-thread.txt',
        mimeType: 'text/plain',
        sourceType: 'email',
      },
      {
        fileName: 'acme-vendor-consolidation-memo.txt',
        fixturePath: 'acme-vendor-consolidation-memo.txt',
        mimeType: 'text/plain',
        sourceType: 'note',
      },
    ],
  },
  {
    clientName: 'Adventist Health',
    projectName: 'June Site Visit',
    description: 'Multi-facility digital rollout with live sites, staffing escalations, and board deck preparation.',
    status: 'watch',
    files: [
      {
        fileName: 'morning-meeting-notes.txt',
        fixturePath: 'adventist-morning-meeting-notes.txt',
        mimeType: 'text/plain',
        sourceType: 'meeting',
      },
      {
        fileName: 'adventist-q2-deck.txt',
        fixturePath: 'adventist-q2-deck.txt',
        mimeType: 'text/plain',
        sourceType: 'deck',
      },
      {
        fileName: 'afternoon-email-concerns.txt',
        fixturePath: 'adventist-afternoon-email.txt',
        mimeType: 'text/plain',
        sourceType: 'email',
      },
      {
        fileName: 'portland-escalation-call.vtt',
        fixturePath: 'adventist-portland-escalation-transcript.vtt',
        mimeType: 'text/vtt',
        sourceType: 'transcript',
      },
      {
        fileName: 'rollout-status-report.pdf',
        fixturePath: 'adventist-rollout-status-report.pdf',
        mimeType: 'application/pdf',
        sourceType: 'pdf',
      },
      {
        fileName: 'staffing-assessment.md',
        fixturePath: 'adventist-staffing-assessment.md',
        mimeType: 'text/markdown',
        sourceType: 'note',
      },
    ],
  },
];

export const LEGACY_DEMO_PROJECT_NAMES = ['June Site Visit'];
