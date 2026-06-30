import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/TabBarIcon';
import { SUNNY_MARK_COLORS } from '@/components/SunnyMark';
import { BRAND, spacing } from '@/theme/colors';

export const TAB_BAR_HEIGHT = 56;
export const TAB_BAR_MARGIN_H = 20;
export const TAB_BAR_MARGIN_BOTTOM = 18;

const PILL_BORDER_WIDTH = 1;
/** Soft logo-gradient ring — same hues as UpperDeck icon, much lighter. */
const LOGO_GRADIENT = [
  'rgba(191, 219, 254, 0.95)',
  'rgba(147, 197, 253, 0.75)',
  'rgba(96, 165, 250, 0.55)',
] as const;

export function floatingTabBarClearance(bottomInset: number): number {
  return TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM + bottomInset + spacing.md;
}

/** Scroll padding so the last item clears the floating pill. */
export function useFloatingTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return floatingTabBarClearance(insets.bottom);
}

/** Lift fixed footers above the floating pill. */
export function useFloatingTabBarLift(): number {
  return TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM + spacing.sm;
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const activeRoute = state.routes[state.index]?.name;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardOpen && activeRoute === 'sunny') {
    return null;
  }

  return (
    <View
      style={[styles.overlay, { paddingBottom: insets.bottom + TAB_BAR_MARGIN_BOTTOM }]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={[...LOGO_GRADIENT]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pillBorder}
      >
        <View style={styles.pill}>
          <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const isSunny = route.name === 'sunny';
            const label = options.title ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
              >
                <View
                  style={[
                    styles.iconShell,
                    focused && (isSunny ? styles.iconShellSunny : styles.iconShellActive),
                  ]}
                >
                  <TabBarIcon
                    routeName={route.name}
                    focused={focused}
                    color={focused ? (isSunny ? SUNNY_MARK_COLORS.face : BRAND.accent) : BRAND.textMuted}
                  />
                </View>
              </Pressable>
            );
          })}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: TAB_BAR_MARGIN_H,
  },
  pillBorder: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    padding: PILL_BORDER_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#0E1115',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pill: {
    flex: 1,
    borderRadius: TAB_BAR_HEIGHT / 2 - PILL_BORDER_WIDTH,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShell: {
    width: 52,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  iconShellSunny: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
});
