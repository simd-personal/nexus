import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BRAND } from '@/theme/colors';

export const themedStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerBackVisible: true,
  headerBackButtonDisplayMode: 'minimal',
  headerTintColor: BRAND.graphite,
  headerStyle: {
    backgroundColor: BRAND.cream,
  },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    color: BRAND.graphite,
  },
};

export function stackDetailScreenOptions(
  title: string,
  overrides: NativeStackNavigationOptions = {}
): NativeStackNavigationOptions {
  return {
    ...themedStackScreenOptions,
    title,
    ...overrides,
  };
}
