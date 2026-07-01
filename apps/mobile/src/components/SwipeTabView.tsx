import type { ReactNode } from 'react';
import { useNavigation } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

/** Bottom tab order — keep in sync with app/(tabs)/_layout.tsx. */
export const TAB_ORDER = ['index', 'projects', 'sunny', 'critical'] as const;
export type TabName = (typeof TAB_ORDER)[number];

const SWIPE_DISTANCE = 60;

/**
 * Wraps a tab screen so a horizontal swipe switches to the adjacent tab.
 * Vertical drags fall through to the underlying ScrollView / pull-to-refresh.
 */
export function SwipeTabView({ current, children }: { current: TabName; children: ReactNode }) {
  const navigation = useNavigation();
  const index = TAB_ORDER.indexOf(current);

  const goTo = (direction: 1 | -1) => {
    const next = index + direction;
    if (next < 0 || next >= TAB_ORDER.length) return;
    (navigation as unknown as { navigate: (name: string) => void }).navigate(TAB_ORDER[next]);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .failOffsetY([-16, 16])
    .runOnJS(true)
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_DISTANCE) goTo(1);
      else if (event.translationX >= SWIPE_DISTANCE) goTo(-1);
    });

  return <GestureDetector gesture={pan}>{children}</GestureDetector>;
}
