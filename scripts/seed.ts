/**
 * BriefNexus Demo Seed Script
 *
 * Seeds a demo project with sample meeting notes, email, and deck content
 * that demonstrates Sunny's contradiction detection workflow.
 *
 * Usage:
 *   1. Create a user account via the app login page
 *   2. Set env vars in .env.local
 *   3. Run: npm run seed
 *
 * Security: Uses service role key — never run in browser or expose to client.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { processFile } from '../src/lib/processing/pipeline';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEMO_EMAIL = process.env.SEED_USER_EMAIL || 'sim@test.com';

const MEETING_NOTES = `Adventist Health — June Site Visit
Date: June 15, 2025, 9:00 AM
Attendees: Sarah Chen (Client VP), Mike Torres (Client Ops), Sim Patel (Our Team Lead)

Meeting Summary:
Sarah opened by expressing satisfaction with the current rollout progress. She noted that
three facilities — Portland Medical Center, Salem Community Hospital, and Eugene Regional —
are now live and operating smoothly.

"The client is comfortable with the current rollout," Sarah stated. "Response times have
improved 40% since go-live and staff adoption is at 85%."

Mike confirmed staffing levels are adequate at all live sites. No major concerns were raised
about response delays or coverage gaps.

Next steps discussed:
- Schedule follow-up visit to remaining 4 facilities in July
- Share updated deck with Q2 metrics for board presentation
- Sim to send recap email by end of day

Facilities mentioned: Portland Medical Center, Salem Community Hospital, Eugene Regional,
Bend Health Campus (planned), Medford Clinic (planned)
`;

const FOLLOW_UP_EMAIL = `From: mike.torres@adventisthealth.org
To: sim.patel@company.com
Date: June 15, 2025, 2:30 PM
Subject: RE: Morning Site Visit — Staffing Concerns

Hi Sim,

Thanks for the productive morning session. I wanted to follow up on a few items
that I didn't raise during the meeting but need to address urgently.

We are still concerned about staffing and response delays at Portland Medical Center
and Salem Community Hospital. Despite the positive tone this morning, we've received
three escalations this week about 45+ minute response times during peak hours.

Our nursing directors at both sites report they are understaffed for the new workflow.
Bend Health Campus is also at risk — we may need to delay the go-live by 2 weeks if
staffing isn't resolved.

Can we schedule a call tomorrow to discuss? This needs leadership attention before
we proceed with the board presentation Sarah mentioned.

Best,
Mike Torres
Director of Operations, Adventist Health
`;

const DECK_CONTENT = `Adventist Health — Q2 Rollout Update Deck
Page 1: Executive Summary

Client: Adventist Health
Project: Multi-Facility Digital Rollout
Status: On Track (3 of 7 facilities live)

Key Metrics:
- 3 facilities live: Portland, Salem, Eugene
- 85% staff adoption rate
- 40% improvement in response times
- 4 remaining facilities targeted for Q3

Page 2: Facility Status

Portland Medical Center — LIVE — Healthy
Salem Community Hospital — LIVE — Healthy
Eugene Regional — LIVE — Healthy
Bend Health Campus — PLANNED — July 2025
Medford Clinic — PLANNED — August 2025
Roseburg Medical — PLANNED — September 2025
Grants Pass Community — PLANNED — October 2025

Page 3: Risks & Mitigations

Risk: Staffing gaps at high-volume sites
Mitigation: Additional training sessions scheduled
Status: Monitoring

Risk: Board presentation timeline
Mitigation: Deck ready for Sarah's review by June 20
Status: On track
`;

async function seed() {
  console.log('🌱 Seeding BriefNexus demo data...\n');

  // Find user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === DEMO_EMAIL);

  if (!user) {
    console.error(`❌ User ${DEMO_EMAIL} not found.`);
    console.error('   Create an account first via the login page, then re-run seed.');
    console.error('   Or set SEED_USER_EMAIL to your account email.');
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.email}`);

  // Check for existing demo project
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_id', user.id)
    .eq('project_name', 'June Site Visit')
    .single();

  if (existing) {
    console.log('⚠ Demo project already exists. Skipping seed.');
    console.log(`   Project ID: ${existing.id}`);
    process.exit(0);
  }

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      owner_id: user.id,
      client_name: 'Adventist Health',
      project_name: 'June Site Visit',
      description: 'Multi-facility site visit and rollout assessment for Adventist Health system.',
      status: 'watch',
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error('❌ Failed to create project:', projectError?.message);
    process.exit(1);
  }

  console.log(`✓ Created project: ${project.project_name} (${project.id})`);

  // Process demo files sequentially (meeting first, then email to trigger contradiction)
  const demoFiles = [
    { name: 'morning-meeting-notes.txt', content: MEETING_NOTES, sourceType: 'meeting' as const },
    { name: 'adventist-q2-deck.txt', content: DECK_CONTENT, sourceType: 'deck' as const },
    { name: 'afternoon-email-concerns.txt', content: FOLLOW_UP_EMAIL, sourceType: 'email' as const },
  ];

  for (const demo of demoFiles) {
    console.log(`\n📄 Processing: ${demo.name}...`);

    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .insert({
        project_id: project.id,
        uploaded_by: user.id,
        file_name: demo.name,
        file_type: 'text/plain',
        source_type: demo.sourceType,
        status: 'pending',
      })
      .select()
      .single();

    if (fileError || !fileRecord) {
      console.error(`   ❌ Failed to create file record: ${fileError?.message}`);
      continue;
    }

    await processFile({
      fileId: fileRecord.id,
      projectId: project.id,
      fileName: demo.name,
      sourceType: demo.sourceType,
      pastedText: demo.content,
    });

    console.log(`   ✓ Processed: ${demo.name}`);
  }

  console.log('\n✅ Demo seed complete!');
  console.log('\nNext steps:');
  console.log('  1. Open http://localhost:3000/dashboard');
  console.log('  2. View the Adventist Health project');
  console.log('  3. Check Critical Items for the meeting/email contradiction');
  console.log('  4. Ask Sunny: "Did anyone send an email that says something different?"');
}

seed().catch(console.error);
