import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { APP } from '@/theme/colors';

export const themedStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerBackVisible: true,
  headerBackButtonDisplayMode: 'minimal',
  headerTintColor: APP.text,
  headerStyle: {
    backgroundColor: APP.canvas,
  },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    color: APP.text,
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
