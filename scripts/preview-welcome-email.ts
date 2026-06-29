/**
 * Renders the branded welcome email to scripts/fixtures/welcome-email-preview.html
 * so you can open it in a browser. Usage: npx tsx scripts/preview-welcome-email.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { renderWelcomeEmail } from '../src/lib/email/templates';

const { subject, html } = renderWelcomeEmail({
  fullName: 'Sim Carter',
  appUrl: 'https://upperdeck.dev/dashboard',
});

const outDir = resolve(process.cwd(), 'scripts/fixtures');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, 'welcome-email-preview.html');
writeFileSync(outFile, html, 'utf8');

console.log(`Subject: ${subject}`);
console.log(`Preview written to: ${outFile}`);
