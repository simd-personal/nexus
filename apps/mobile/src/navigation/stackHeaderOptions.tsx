import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { BRAND } from '@/theme/colors';

export const themedStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerBackVisible: false,
  headerTintColor: BRAND.graphite,
  headerStyle: {
    backgroundColor: BRAND.stone,
  },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    color: BRAND.graphite,
  },
  headerLeft: ({ canGoBack }) =>
    canGoBack ? (
      <Pressable
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
          size={Platform.OS === 'ios' ? 28 : 24}
          color={BRAND.graphite}
        />
      </Pressable>
    ) : null,
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

const styles = StyleSheet.create({
  backButton: {
    marginLeft: Platform.OS === 'ios' ? 2 : 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
