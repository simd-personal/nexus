# UpperDeck Mobile (iOS)

Expo React Native app — see repo root `AGENTS.md` for monorepo layout.

## Quick start

**Option A — from repo root (recommended)**

```bash
# One-time
cd apps/mobile && npm install && cd ../..

# Terminal 1 — API backend
npm run dev

# Terminal 2 — iOS simulator
npm run mobile:ios
```

**Option B — from `apps/mobile/`**

```bash
# Terminal 1 — from repo root
npm run dev

# Terminal 2 — from apps/mobile
npm run ios
```

Do **not** use `npm run dev` inside `apps/mobile` for the web API — that script is only at repo root. Inside `apps/mobile`, `npm run dev` starts the Expo bundler.

`npm run mobile:ios` only works from **repo root**, not from `apps/mobile`.

## Commands

| Command | Where | What |
|---------|-------|------|
| `npm run mobile:env` | repo root | Sync `apps/mobile/.env` from `.env.local` |
| `npm run mobile:ios` | repo root | Sync env + open iOS simulator |
| `npm run mobile:start` | repo root | Sync env + Expo dev menu |
| `npm run ios` | `apps/mobile/` | Expo iOS only (run `mobile:env` first) |

## Environment

`apps/mobile/.env` is **auto-generated** — do not edit by hand. Update `.env.local` at repo root, then:

```bash
npm run mobile:env
```

| Variable | Source |
|----------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_URL` | `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`) |

**Physical iPhone:** after `mobile:env`, the script prints your LAN IP. Set `EXPO_PUBLIC_API_URL=http://<your-ip>:3000` in `apps/mobile/.env` and restart Expo.

## Shared code

Types and brand colors live in `packages/shared/` (`@upperdeck/shared`). Mobile re-exports types from `src/lib/types.ts`.

## Features

- Home dashboard (stats + Sunny updates + critical items)
- Critical items with acknowledge/resolve
- Sunny streaming chat
- Projects + native photo upload
