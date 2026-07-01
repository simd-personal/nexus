import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderIconButton } from '@/components/ScreenHeader';
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
      <View style={styles.headerSideSlot}>
        <HeaderIconButton
          compact
          label="Go back"
          icon={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
          onPress={() => router.back()}
        />
      </View>
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
  headerSideSlot: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: Platform.OS === 'ios' ? 8 : 4,
  },
});
