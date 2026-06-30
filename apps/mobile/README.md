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
| `npm run mobile:ios:rebuild` | repo root | Rebuild native iOS app after splash/icon changes |

## Splash screen

The launch splash is **native** (baked into the iOS build). After changing splash assets or `app.json`, rebuild once:

```bash
npm run mobile:ios:rebuild
```

A Metro reload is not enough — you need a fresh native install to drop the old static Sunny splash.

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

## Share with testers (EAS internal build)

Use this for a small group — no App Store review. Builds install via a link from the Expo dashboard.

### One-time setup

1. Install EAS CLI and log in:

   ```bash
   npm i -g eas-cli
   eas login
   ```

2. Link the app to Expo (from `apps/mobile/`):

   ```bash
   cd apps/mobile
   eas build:configure
   ```

3. Point mobile at your **deployed** API in `.env.local` at repo root:

   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-production-url.com
   ```

4. Create a Supabase test account for your tester(s).

### iOS: register devices first

Internal iOS builds only install on registered devices. Each tester needs to register once:

```bash
cd apps/mobile
eas device:create
```

Send them the link EAS prints. After they register, rebuild (step below).

### Build and share

From **`apps/mobile/`**:

```bash
npm run build:preview:ios
```

From **repo root**:

```bash
npm run mobile:build:preview:ios
```

When the build finishes, open [expo.dev](https://expo.dev) → your project → **Builds** → open the build → **Install** / QR code. Send that link to testers.

| Platform | Tester installs via |
|----------|---------------------|
| iOS | Safari → install profile → trust developer in Settings → open app |
| Android | Download APK from the build page |

### Rebuild when env or code changes

`EXPO_PUBLIC_*` values are baked in at build time. After changing API URL or Supabase keys:

```bash
npm run mobile:eas:env
npm run mobile:build:preview:ios
```

### Useful commands

| Command | What |
|---------|------|
| `npm run mobile:eas:env` | Push env vars to EAS preview (no build) |
| `npm run mobile:build:preview:ios` | Internal iOS build |
| `npm run mobile:build:preview:android` | Internal Android APK |
| `cd apps/mobile && eas device:create` | Register a tester iPhone |
| `cd apps/mobile && eas build:list` | Recent builds |

## Features

- Home dashboard (stats + Sunny updates + critical items)
- Critical items with acknowledge/resolve
- Sunny streaming chat
- Projects + native photo upload
