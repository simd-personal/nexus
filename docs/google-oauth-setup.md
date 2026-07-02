# Google OAuth setup (web + mobile)

Code is in place on both platforms; sign-in works once the credentials below are
configured. Until then the web button errors gracefully and the mobile button is
hidden.

## 1. Google Cloud Console

At [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services:

1. **OAuth consent screen** — External. App name "UpperDeck", support email, domain
   `upperdeck.dev`. Scopes: only the defaults (`openid`, `email`, `profile`) —
   these are non-sensitive, so no Google verification review is required.
2. **Credentials → Create OAuth client ID**, three clients:

| Client type | Settings | Used by |
|---|---|---|
| Web application | Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (find the exact URL under Supabase → Authentication → Providers → Google). Authorized JS origins: `https://upperdeck.dev`, `http://localhost:3000` | Supabase dashboard (ID + secret) and mobile `webClientId` |
| iOS | Bundle ID: `dev.upperdeck.app` | Mobile native sign-in |
| Android | Package: `dev.upperdeck.app` + SHA-1 fingerprints (debug **and** the EAS production keystore — `eas credentials` shows it) | Mobile native sign-in (Android) |

## 2. Supabase dashboard

Authentication → Providers → Google:

1. Enable, paste the **web** client ID and secret.
2. In **Authorized Client IDs**, list all client IDs comma-separated with the
   web client ID **first**: `web-id,ios-id,android-id`. This is what lets
   `signInWithIdToken` accept mobile ID tokens.
3. Enable **Skip nonce check** — required for iOS because the native
   google-signin library doesn't expose a nonce parameter.

Also confirm Authentication → URL Configuration has `https://upperdeck.dev/auth/callback`
(and localhost + Vercel previews if used) in the redirect allow-list.

## 3. Env vars

Root `.env.local` (then run `npm run mobile:env`, and `npm run mobile:eas:env` for EAS):

```bash
GOOGLE_OAUTH_WEB_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
GOOGLE_OAUTH_IOS_CLIENT_ID=1234567890-def.apps.googleusercontent.com
```

The web app needs **no** env vars — Supabase holds the web credentials server-side.

## 4. Rebuild mobile

The native module and its iOS URL scheme (injected by `app.config.js` from the iOS
client ID) require a fresh native build: `npm run mobile:ios` locally, or a new EAS
build. The Google button appears automatically once the env vars are present.

## How it works

- **Web**: `Continue with Google` form-POSTs to `POST /api/auth/google` (same
  corporate-proxy-safe pattern as password sign-in), which 303-redirects to Google
  with PKCE cookies set. Google returns to `/auth/callback`, which exchanges the
  code, sends the welcome email to first-time users, and routes them to
  `/getting-started` (or `/upgrade?plan=…` if they arrived from pricing).
- **Mobile**: native Google sheet via `@react-native-google-signin/google-signin`,
  then `supabase.auth.signInWithIdToken` — no browser redirect. Face ID re-login
  keeps working (the refresh token is stored the same way as password sign-in).
- **Account linking**: Supabase links a Google sign-in to an existing
  email/password account automatically when the verified email matches, so
  existing users won't get duplicate accounts.
