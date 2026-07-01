import { Text, TextInput } from 'react-native';
import {
  PlusJakartaSans_300Light,
  PlusJakartaSans_300Light_Italic,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

/**
 * Font assets loaded via `useFonts` in the root layout. Registered per weight so
 * styles that set an explicit `fontFamily` (e.g. the italic tagline) can opt in.
 */
export const JAKARTA_FONTS = {
  PlusJakartaSans_300Light,
  PlusJakartaSans_300Light_Italic,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_400Regular_Italic,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} as const;

export const JAKARTA_REGULAR = 'PlusJakartaSans_400Regular';

let installed = false;

/**
 * Sets Plus Jakarta Sans as the default typeface via defaultProps. This is the
 * conservative, New-Architecture-safe approach (no render monkey-patching).
 * `fontWeight` in individual styles still applies as a synthesized weight.
 */
export function installJakartaFont(): void {
  if (installed) return;
  installed = true;

  const apply = (Component: unknown) => {
    const comp = Component as { defaultProps?: { style?: unknown } };
    const existing = comp.defaultProps?.style;
    comp.defaultProps = {
      ...comp.defaultProps,
      style: existing ? [{ fontFamily: JAKARTA_REGULAR }, existing] : { fontFamily: JAKARTA_REGULAR },
    };
  };

  apply(Text);
  apply(TextInput);
}
