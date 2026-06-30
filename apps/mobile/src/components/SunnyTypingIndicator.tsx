import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT = '#FBBF24';

function BounceDot({ delayMs }: { delayMs: number }) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(withTiming(-4, { duration: 180 }), withTiming(0, { duration: 180 })),
        -1,
        false
      )
    );
  }, [delayMs, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function SunnyTypingIndicator() {
  return (
    <View style={styles.row} accessibilityLabel="Sunny is typing">
      <BounceDot delayMs={0} />
      <BounceDot delayMs={120} />
      <BounceDot delayMs={240} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DOT,
  },
});
