import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { SEED_FIXTURES_DIR } from './seed-helpers';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const LINE_HEIGHT = 14;
const FONT_SIZE = 10;

async function writeTextPdf(
  outputName: string,
  title: string,
  sections: Array<{ heading: string; paragraphs: string[] }>
): Promise<void> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawLine = (text: string, opts?: { bold?: boolean; size?: number }) => {
    const size = opts?.size ?? FONT_SIZE;
    const activeFont = opts?.bold ? bold : font;
    const maxWidth = PAGE_WIDTH - MARGIN * 2;
    const words = text.split(/\s+/);
    let line = '';

    const flush = () => {
      if (y < MARGIN + LINE_HEIGHT) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(line, { x: MARGIN, y, size, font: activeFont, color: rgb(0.1, 0.1, 0.1) });
      y -= LINE_HEIGHT + 2;
      line = '';
    };

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (activeFont.widthOfTextAtSize(candidate, size) > maxWidth) {
        flush();
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) flush();
  };

  drawLine(title, { bold: true, size: 16 });
  y -= 8;

  for (const section of sections) {
    y -= 6;
    drawLine(section.heading, { bold: true, size: 12 });
    y -= 4;
    for (const paragraph of section.paragraphs) {
      drawLine(paragraph);
      y -= 6;
    }
  }

  const bytes = await pdf.save();
  writeFileSync(join(SEED_FIXTURES_DIR, outputName), bytes);
}

export async function ensureSeedPdfs(): Promise<void> {
  mkdirSync(SEED_FIXTURES_DIR, { recursive: true });

  const acmePath = join(SEED_FIXTURES_DIR, 'acme-q3-board-pack.pdf');
  if (!existsSync(acmePath)) {
    await writeTextPdf('acme-q3-board-pack.pdf', 'Acme Corp Q3 Board Pack', [
      {
        heading: 'Executive Summary',
        paragraphs: [
          'Acme Corp entered Q3 with board alignment on west region expansion across Denver, Phoenix, and Salt Lake City. Revenue grew 12 percent year over year in the west division, driven by enterprise renewals and two new healthcare logos signed in May. The executive team confirmed vendor consolidation as the top operating priority for the remainder of the year.',
          'Finance requires a refreshed ROI model before the June 28 executive sync. Operations owns the vendor cutover plan with a July 15 readiness target. Legal completed redlines on the primary SaaS agreement on June 20. The board expects a single narrative on expansion timing, staffing, and vendor risk at the next meeting.',
        ],
      },
      {
        heading: 'West Region Expansion',
        paragraphs: [
          'Denver: Facility timeline approved March 15. Real estate selected in the LoDo district. Hiring plan calls for 18 FTE by September, including 6 senior implementation consultants. Local partner Apex Systems submitted staffing proposals June 18.',
          'Phoenix: Market assessment completed April 30. Client pipeline includes three qualified enterprise opportunities. Board asked for conservative revenue recognition until Phoenix general manager is hired. Recruiting kickoff scheduled July 8.',
          'Salt Lake City: Still in feasibility. Operations requested Q4 decision gate. CFO Lisa Park noted capital constraints if all three metros launch simultaneously.',
        ],
      },
      {
        heading: 'Vendor Consolidation Program',
        paragraphs: [
          'Current state: Acme runs 14 overlapping SaaS vendors across CRM, ticketing, analytics, and document workflow. Annual spend estimated at 4.2M with 23 percent duplicate capability.',
          'Target state: Consolidate to 6 strategic vendors by Q1 next year. Maria Santos leads cutover planning. Phase 1 migrates analytics and reporting by August 30. Phase 2 migrates customer success tooling by October 15.',
          'Key risks: Data migration windows, training load on client success managers, and temporary reporting gaps during cutover weekends.',
        ],
      },
      {
        heading: 'Financial Outlook',
        paragraphs: [
          'Q3 revenue forecast: 48.6M with west region contributing 11.2M. Gross margin stable at 61 percent. Operating expense growth tied to expansion hiring.',
          'ROI model assumptions: Denver break even month 14, Phoenix month 18, combined west region IRR 19 percent under base case. Stress case delays Phoenix launch one quarter and reduces IRR to 14 percent.',
          'Lisa Park requested scenario tabs for board sensitivity on staffing delays and vendor migration overruns.',
        ],
      },
      {
        heading: 'Open Decisions for Board',
        paragraphs: [
          'Approve Denver hiring plan and recruiting budget of 1.1M.',
          'Confirm July 15 vendor cutover readiness review as a gating milestone.',
          'Decide whether Phoenix launch remains Q4 or moves to Q1 pending GM hire.',
          'Ratify executive communication plan for client-facing teams before cutover weekends.',
        ],
      },
      {
        heading: 'Appendix: Facility and Stakeholder Map',
        paragraphs: [
          'Executive sponsors: James Wright CEO, Lisa Park CFO, Maria Santos COO, David Chen CRO.',
          'Program leads: Sim Patel client delivery, Nora Ali vendor PMO, Kevin Brooks west region GM Denver.',
          'Facilities referenced in Q3 materials: Denver LoDo office, Phoenix Tempe satellite, Portland client site visit notes, Salem workflow pilot.',
          'This document supports the Q3 Business Review project and should be read alongside the June 27 executive call transcript and Denver site visit notes.',
        ],
      },
    ]);
    console.log('✓ Generated acme-q3-board-pack.pdf');
  }

  const adventistPath = join(SEED_FIXTURES_DIR, 'adventist-rollout-status-report.pdf');
  if (!existsSync(adventistPath)) {
    await writeTextPdf('adventist-rollout-status-report.pdf', 'Adventist Health Digital Rollout Status Report', [
      {
        heading: 'Program Overview',
        paragraphs: [
          'Adventist Health is executing a multi-facility digital rollout across seven hospitals in Oregon and Northern California. Three facilities are live: Portland Medical Center, Salem Community Hospital, and Eugene Regional. Four facilities remain in planning: Bend, Medford, Roseburg, and Grants Pass.',
          'Program objectives include reducing clinical response times, standardizing nursing workflows, and preparing metrics for the September board presentation led by Sarah Chen VP of Transformation.',
        ],
      },
      {
        heading: 'Live Site Performance',
        paragraphs: [
          'Portland Medical Center reported 85 percent staff adoption in morning site visit notes June 15. Afternoon escalation email from Mike Torres cited three incidents of 45 plus minute response times during peak hours the same week.',
          'Salem Community Hospital mirrors Portland patterns: strong leadership messaging in meetings, frontline staffing gaps during evening shifts. Eugene Regional remains the strongest performer with stable coverage and fewer escalations.',
        ],
      },
      {
        heading: 'Planned Go Lives',
        paragraphs: [
          'Bend Health Campus target July 22 may slip two weeks if staffing plans are not approved by June 30. Medford Clinic remains August timeline. Roseburg and Grants Pass depend on training cohort availability in September.',
          'Implementation partner recommends consolidated training calendar and shared float pool across Portland and Salem before Bend launch.',
        ],
      },
      {
        heading: 'Risk Register',
        paragraphs: [
          'Staffing and response delays at high volume sites. Mitigation: supplemental training and temporary agency nurses.',
          'Contradictory stakeholder narratives between executive meetings and operations email threads. Mitigation: joint leadership call and single source of truth dashboard.',
          'Board deck timeline: Sarah Chen needs Q2 metrics deck by June 20. Mike Torres needs staffing remediation plan before deck finalization.',
        ],
      },
      {
        heading: 'Recommended Actions',
        paragraphs: [
          'Schedule leadership call with Sarah Chen and Mike Torres within 48 hours.',
          'Publish weekly response time dashboard by facility with peak hour breakdown.',
          'Delay Bend go live if staffing threshold metrics are not met by June 30.',
          'Align public board narrative with operational reality before September presentation.',
        ],
      },
    ]);
    console.log('✓ Generated adventist-rollout-status-report.pdf');
  }
}

if (process.argv[1]?.endsWith('build-seed-pdfs.ts')) {
  ensureSeedPdfs().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
