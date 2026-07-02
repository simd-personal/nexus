/**
 * Native Google Sign-In → ID token, exchanged for a Supabase session via
 * signInWithIdToken (no browser redirect). Requires a development build with
 * the google-signin plugin — the module is required lazily so builds without
 * it (or without client IDs) don't crash at import time.
 */

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

export function isGoogleSignInConfigured(): boolean {
  return Boolean(WEB_CLIENT_ID);
}

export type GoogleIdTokenResult =
  | { idToken: string }
  | { cancelled: true }
  | { error: string };

let configured = false;

export async function getGoogleIdToken(): Promise<GoogleIdTokenResult> {
  if (!WEB_CLIENT_ID) {
    return { error: 'Google sign-in is not configured for this build.' };
  }

  let googleSignin: typeof import('@react-native-google-signin/google-signin');
  try {
    googleSignin = require('@react-native-google-signin/google-signin');
  } catch {
    return { error: 'Google sign-in requires an updated app build.' };
  }

  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = googleSignin;

  try {
    if (!configured) {
      GoogleSignin.configure({
        // Web client ID is required for Supabase server-side token verification.
        webClientId: WEB_CLIENT_ID,
        ...(IOS_CLIENT_ID ? { iosClientId: IOS_CLIENT_ID } : {}),
      });
      configured = true;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { cancelled: true };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return { error: 'Google did not return a sign-in token. Please try again.' };
    }

    return { idToken };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return { cancelled: true };
      if (error.code === statusCodes.IN_PROGRESS) return { cancelled: true };
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: 'Google Play Services is unavailable or out of date.' };
      }
    }
    return { error: 'Google sign-in failed. Please try again.' };
  }
}
