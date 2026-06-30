<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Monorepo layout

| Path | Purpose |
|------|---------|
| `/` (repo root) | Next.js web app + API backend |
| `apps/mobile/` | Expo React Native iOS/Android client |
| `packages/shared/` | Shared brand tokens + mobile API types |
| `supabase/` | Database migrations (shared) |

## Where to put changes

- **API routes, auth, AI, file processing** → repo root (`src/app/api/`, `src/lib/`)
- **Mobile UI, navigation, native features** → `apps/mobile/`
- **Types used by both web API responses and mobile** → `packages/shared/src/mobile.ts`
- **Brand colors** → `packages/shared/src/brand.ts` (web re-exports via `src/lib/brand/colors.ts`)

Mobile is **not** an npm workspace (to avoid Metro version conflicts with Next.js). Install its deps separately:

```bash
cd apps/mobile && npm install
```

Mobile must not import from web `src/` paths. Web must not import from `apps/mobile/`.

## Local mobile development

From repo root (requires `.env.local` with Supabase keys):

```bash
npm run dev          # terminal 1 — API on :3000
npm run mobile:ios   # terminal 2 — syncs apps/mobile/.env then opens iOS simulator
```

`npm run mobile:env` copies `NEXT_PUBLIC_SUPABASE_*` and `NEXT_PUBLIC_SITE_URL` from `.env.local` into `apps/mobile/.env`.

## Mobile API auth

Mobile uses Supabase JWT bearer tokens on `/api/*` routes. When adding protected endpoints, use `requireRequestAuth()` from `src/lib/supabase/request-auth.ts`.
