/**
 * Resend setup: validate API key, ensure upperdeck.dev domain, print DNS records.
 *
 * Usage:
 *   1. Create an API key → https://resend.com/api-keys
 *   2. Add RESEND_API_KEY=re_... to .env.local
 *   3. npm run resend:setup
 *   4. Add DNS records at your domain registrar, then re-run with --verify
 *
 * Options:
 *   --create       Add upperdeck.dev to Resend if missing
 *   --verify       Trigger domain verification check after DNS is live
 *   --test-email=x Send a sample welcome email to this address
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Resend } from 'resend';
import { APP_DOMAIN } from '../src/lib/constants';
import { renderWelcomeEmail } from '../src/lib/email/templates';
import { getFromAddress } from '../src/lib/email/client';

config({ path: resolve(process.cwd(), '.env.local') });

const args = process.argv.slice(2);
const shouldCreate = args.includes('--create');
const shouldVerify = args.includes('--verify');
const testEmailArg = args.find((a) => a.startsWith('--test-email='));
const testEmail = testEmailArg?.split('=')[1]?.trim();

function isPlaceholderKey(key: string | undefined): boolean {
  if (!key?.trim()) return true;
  const lower = key.toLowerCase();
  return lower.includes('your-resend') || lower === 're_...';
}

function printDnsRecords(
  records: Array<{
    record: string;
    name: string;
    type: string;
    value: string;
    priority?: number;
    status?: string;
  }>
) {
  console.log('\nDNS records to add at your domain registrar:\n');
  for (const r of records) {
    const host = r.name === APP_DOMAIN ? '@' : r.name.replace(`.${APP_DOMAIN}`, '') || r.name;
    console.log(`  ${r.record} (${r.status ?? 'pending'})`);
    console.log(`    Type:     ${r.type}`);
    console.log(`    Host:     ${host}`);
    console.log(`    Value:    ${r.value}`);
    if (r.priority != null) console.log(`    Priority: ${r.priority}`);
    console.log('');
  }
}

function printFooter() {
  console.log('Supabase password-reset SMTP (optional, same Resend key):');
  console.log('  https://supabase.com/dashboard/project/pvrrlgcmbmajrmpowxoq/auth/smtp');
  console.log('  Host: smtp.resend.com  Port: 465  User: resend  Pass: your RESEND_API_KEY');
  console.log(`  Sender: ${getFromAddress()}\n`);

  console.log('Vercel env vars (project: nexus):');
  console.log('  https://vercel.com/sim-d/nexus/settings/environment-variables');
  console.log('  RESEND_API_KEY');
  console.log(`  EMAIL_FROM=${getFromAddress()}`);
  console.log(`  EMAIL_REPLY_TO=support@${APP_DOMAIN}`);
}

async function trySendTestEmail(resend: Resend) {
  if (!testEmail) return;
  const { subject, html, text } = renderWelcomeEmail({
    fullName: 'Test User',
    appUrl: `https://${APP_DOMAIN}/dashboard`,
  });
  const { error: sendError } = await resend.emails.send({
    from: getFromAddress(),
    to: testEmail,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || `support@${APP_DOMAIN}`,
    subject,
    html,
    text,
  });
  if (sendError) {
    console.error('❌ Test email failed:', sendError.message);
    if (sendError.message.toLowerCase().includes('not verified')) {
      console.log('\n   Domain may still be propagating. Check https://resend.com/domains\n');
    }
  } else {
    console.log(`✅ Test welcome email sent to ${testEmail}\n`);
  }
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (isPlaceholderKey(apiKey)) {
    console.log('Resend setup\n');
    console.log('❌ RESEND_API_KEY is missing or still a placeholder in .env.local\n');
    console.log('Do this:');
    console.log('  1. Open https://resend.com/api-keys');
    console.log('  2. Create an API key (Full access or Sending access)');
    console.log('  3. Add to .env.local:');
    console.log('       RESEND_API_KEY=re_xxxxxxxx');
    console.log('  4. Re-run: npm run resend:setup -- --create\n');
    console.log('Also add the same key in Vercel → Project → Settings → Environment Variables.');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  console.log('Resend setup\n');
  console.log(`✓  API key loaded (${apiKey!.slice(0, 6)}…)\n`);

  const { data: listData, error: listError } = await resend.domains.list();
  if (listError) {
    const restricted = listError.message.toLowerCase().includes('restricted');
    if (restricted) {
      console.log('⚠  API key is send-only (cannot manage domains via API).\n');
      if (testEmail) {
        console.log('Attempting test send (domain status checked by Resend on send)…\n');
        await trySendTestEmail(resend);
        printFooter();
        process.exit(0);
      }
      console.log('Add and verify your domain in the Resend dashboard:');
      console.log(`  https://resend.com/domains\n`);
      console.log('Steps:');
      console.log(`  1. Click "Add Domain" → enter ${APP_DOMAIN}`);
      console.log('  2. Copy the DNS records Resend shows (SPF, DKIM, etc.)');
      console.log('  3. Add them at your DNS provider (Vercel, Cloudflare, etc.)');
      console.log('  4. Wait for verification, then run:');
      console.log(`     npm run resend:setup -- --test-email=you@email.com\n`);
      console.log('Optional: create a Full Access key at https://resend.com/api-keys');
      console.log('so this script can add the domain and print DNS records for you.\n');
      await trySendTestEmail(resend);
      printFooter();
      process.exit(0);
    }
    console.error('❌ Could not list domains:', listError.message);
    if (listError.message.toLowerCase().includes('unauthorized')) {
      console.log('\n   Check that RESEND_API_KEY is valid at https://resend.com/api-keys');
    }
    process.exit(1);
  }

  let domain = listData?.data?.find((d) => d.name === APP_DOMAIN);

  if (!domain) {
    if (!shouldCreate) {
      console.log(`⚠  Domain ${APP_DOMAIN} is not in your Resend account yet.\n`);
      console.log('Run with --create to add it:');
      console.log(`  npm run resend:setup -- --create\n`);
      console.log(`Or add it manually: https://resend.com/domains`);
      process.exit(1);
    }

    console.log(`Adding domain ${APP_DOMAIN} to Resend…`);
    const { data: created, error: createError } = await resend.domains.create({
      name: APP_DOMAIN,
    });
    if (createError || !created) {
      console.error('❌ Could not create domain:', createError?.message ?? 'unknown error');
      process.exit(1);
    }
    domain = created;
    console.log(`✓  Domain created (id: ${created.id})\n`);
  } else {
    console.log(`✓  Domain found: ${domain.name} (${domain.status})\n`);
  }

  const { data: detail, error: detailError } = await resend.domains.get(domain.id);
  if (detailError || !detail) {
    console.error('❌ Could not fetch domain details:', detailError?.message ?? 'unknown');
    process.exit(1);
  }

  if (detail.records?.length) {
    printDnsRecords(detail.records);
  }

  if (detail.status === 'verified') {
    console.log(`✅ ${APP_DOMAIN} is verified — ready to send from ${getFromAddress()}\n`);
  } else {
    console.log(`⏳ Domain status: ${detail.status}`);
    console.log('   Add the DNS records above, wait a few minutes, then run:');
    console.log('     npm run resend:setup -- --verify\n');
  }

  if (shouldVerify) {
    console.log('Checking domain verification…');
    const { error: verifyError } = await resend.domains.verify(domain.id);
    if (verifyError) {
      console.error('❌ Verification check failed:', verifyError.message);
    } else {
      const { data: refreshed } = await resend.domains.get(domain.id);
      console.log(`   Status now: ${refreshed?.status ?? 'unknown'}\n`);
    }
  }

  if (testEmail) {
    await trySendTestEmail(resend);
  }

  printFooter();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
