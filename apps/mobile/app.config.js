/**
 * Dynamic Expo config extending app.json.
 *
 * Injects the Google Sign-In native plugin only when EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 * is set (via apps/mobile/.env, synced by `npm run mobile:env`), so builds without
 * Google credentials keep working.
 */
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

  if (iosClientId) {
    // The iOS URL scheme is the reversed client ID.
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace(
      '.apps.googleusercontent.com',
      ''
    )}`;
    config.plugins = [
      ...(config.plugins ?? []),
      ['@react-native-google-signin/google-signin', { iosUrlScheme }],
    ];
  }

  return config;
};
