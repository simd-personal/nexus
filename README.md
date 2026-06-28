# BriefNexus

**One command center for every client project, conversation, deck, email, and decision.**

BriefNexus is an AI command center for client performance, client operations, and executive visibility. Sunny — your AI employee inside the platform — reads every meeting, email, deck, note, transcript, and file, then surfaces what matters: critical items, contradictions, follow-ups, and evidence-backed answers.

## Features

- **Executive Dashboard** — All active projects, Sunny updates, critical items, and global search
- **Sunny Updates** — AI-generated briefings on what changed and what needs attention
- **Project Workspace** — Overview, files, search, brief, critical items, timeline, chat, playbook, follow-up email
- **File Upload & Intake** — Drag-and-drop or paste emails, meeting notes, transcripts, PDFs, audio
- **Semantic Search** — Hybrid keyword + vector search across all project materials
- **Ask Sunny** — Evidence-backed Q&A with citations and confidence levels
- **Critical Item Detection** — Contradictions, risks, missed follow-ups, ownership gaps
- **Timeline** — Chronological project story from uploads to Sunny findings
- **Playbook Generator** — Client operating playbooks (Claude)
- **Follow-Up Email Generator** — Short, detailed, or executive versions (Claude)

## Tech Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase Auth, Postgres, Storage, pgvector
- OpenAI (transcription, embeddings, extraction, chat, critical detection)
- Anthropic Claude (playbooks, memos, strategy documents)
- Zod validation

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- OpenAI API key
- Anthropic API key

## Setup

### 1. Clone and install

```bash
git clone <repo-url> briefnexus
cd briefnexus
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your credentials:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `SUPABASE_STORAGE_BUCKET` | Storage bucket name (default: `briefnexus-files`) |

### 3. Run database migrations

In the Supabase SQL Editor, run these files in order:

1. `supabase/migrations/001_initial_schema.sql` — Tables, RLS, pgvector, search functions
2. `supabase/migrations/002_storage_bucket.sql` — Storage bucket and policies

Also create a storage bucket named `briefnexus-files` in the Supabase dashboard (Storage → New Bucket → private).

### 4. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Seed demo data (optional)

Create an account via the login page, then:

```bash
SEED_USER_EMAIL=your@email.com npm run seed
```

This creates an **Adventist Health — June Site Visit** demo project with:
- Morning meeting notes (positive rollout tone)
- Q2 deck
- Afternoon email (staffing concerns — triggers Sunny contradiction detection)

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed demo project data |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Executive dashboard
│   ├── projects/[id]/      # Project workspace tabs
│   ├── updates/            # Sunny Updates
│   ├── critical-items/     # Global critical items
│   ├── search/             # Global search
│   └── api/                # Upload, search, chat, generate
├── components/             # UI components
├── lib/
│   ├── ai/                 # OpenAI, Claude, Sunny AI layer
│   ├── processing/         # Text extraction, chunking, pipeline
│   ├── supabase/           # Client, server, admin, middleware
│   ├── data/               # Data queries
│   └── actions/            # Server actions
└── types/                  # TypeScript types
supabase/migrations/        # SQL migrations
scripts/seed.ts             # Demo data seeder
```

## MVP Workflow

1. **Sign up / log in** → Land on executive dashboard
2. **Create a project** → e.g. "Adventist Health — June Site Visit"
3. **Upload materials** → Meeting notes, emails, decks, transcripts
4. **Sunny processes** → Extracts text, chunks, embeds, detects critical items
5. **Review dashboard** → See Sunny updates, critical items, contradictions
6. **Search** → "Find the Adventist deck" or "What did the client say about staffing?"
7. **Ask Sunny** → "Did anyone send an email that conflicts with the meeting?"
8. **Generate** → Playbook or follow-up email grounded in evidence

## Security Notes

- API keys are server-side only — never exposed to the browser
- Row Level Security (RLS) on all tables — users only see their own projects
- Files stored in private Supabase Storage bucket
- Source citations are internal only — no public sharing in MVP
- Document text is not logged in full
- **Production:** PHI, PII, and HIPAA safeguards would need expansion before healthcare use

## Model Routing

Users talk to Sunny. Internally, BriefNexus routes work to the right model:

| Task | Model |
|---|---|
| Transcription | OpenAI Whisper |
| Embeddings | text-embedding-3-small |
| Extraction & structured parsing | gpt-4o-mini |
| Chat Q&A & critical detection | gpt-4o |
| Playbooks & executive memos | Claude Sonnet |
| Follow-up emails | Claude Sonnet |

## Future Integrations (not in MVP)

Designed for future addition of Gmail, Slack, Google Drive, Outlook, Microsoft Teams, and calendar sync. MVP uses manual upload and paste.

## License

Private — All rights reserved.
