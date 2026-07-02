import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Bottom tab order — keep in sync with app/(tabs)/_layout.tsx. */
export const TAB_ORDER = ['index', 'projects', 'sunny', 'critical', 'settings'] as const;
export type TabName = (typeof TAB_ORDER)[number];

/** Distance (pt) or flick velocity (pt/s) needed to commit a tab change. */
const DISTANCE_THRESHOLD = 44;
const VELOCITY_THRESHOLD = 420;
/** How closely the screen tracks the finger (with edge rubber-banding). */
const FOLLOW_DAMPING = 0.42;
const EDGE_DAMPING = 0.12;

/**
 * Wraps a tab screen so a horizontal swipe switches to the adjacent tab.
 * The screen follows the finger with resistance for a responsive feel, commits
 * on distance or a quick flick, and springs back. Vertical drags fall through
 * to the underlying ScrollView / pull-to-refresh.
 */
export function SwipeTabView({ current, children }: { current: TabName; children: ReactNode }) {
  const navigation = useNavigation();
  const index = TAB_ORDER.indexOf(current);
  const lastIndex = TAB_ORDER.length - 1;
  const translateX = useSharedValue(0);

  const goTo = (direction: 1 | -1) => {
    const next = index + direction;
    if (next < 0 || next > lastIndex) return;
    (navigation as unknown as { navigate: (name: string) => void }).navigate(TAB_ORDER[next]);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-24, 24])
    .onUpdate((event) => {
      'worklet';
      const goingNext = event.translationX < 0;
      const hasTarget = goingNext ? index < lastIndex : index > 0;
      translateX.value = event.translationX * (hasTarget ? FOLLOW_DAMPING : EDGE_DAMPING);
    })
    .onEnd((event) => {
      'worklet';
      const committed =
        Math.abs(event.translationX) > DISTANCE_THRESHOLD ||
        Math.abs(event.velocityX) > VELOCITY_THRESHOLD;

      if (committed) {
        runOnJS(goTo)(event.translationX < 0 ? 1 : -1);
      }
      translateX.value = withTiming(0, { duration: 190 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.flex, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
