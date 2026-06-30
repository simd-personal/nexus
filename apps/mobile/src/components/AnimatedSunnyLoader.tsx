import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SunnyMark } from '@/components/SunnyMark';
import { BRAND } from '@/theme/colors';

const MARK_SIZE = 88;
const RING_SIZE = MARK_SIZE + 36;

export function AnimatedSunnyLoader() {
  const ringSpin = useSharedValue(0);
  const raySpin = useSharedValue(0);
  const breathe = useSharedValue(0);
  const glow = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    ringSpin.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1
    );
    raySpin.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear }),
      -1
    );
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    dot1.value = withRepeat(
      withSequence(withTiming(1, { duration: 400 }), withTiming(0.25, { duration: 400 })),
      -1
    );
    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.25, { duration: 400 })),
        -1
      )
    );
    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(withTiming(1, { duration: 400 }), withTiming(0.25, { duration: 400 })),
        -1
      )
    );
  }, [breathe, dot1, dot2, dot3, glow, raySpin, ringSpin]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 0.85]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.12]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringSpin.value}deg` }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raySpin.value}deg` }],
  }));

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.05]) }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(dot1.value, [0, 1], [0.85, 1.15]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(dot2.value, [0, 1], [0.85, 1.15]) }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(dot3.value, [0, 1], [0.85, 1.15]) }],
  }));

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View style={[styles.glow, glowStyle]} />
      <View style={styles.stage}>
        <Animated.View style={[styles.ring, ringStyle]}>
          <View style={styles.ringArc} />
          <View style={[styles.ringArc, styles.ringArcSecondary]} />
        </Animated.View>
        <Animated.View style={[styles.rays, raysStyle]}>
          <View style={styles.raysGhost} />
        </Animated.View>
        <Animated.View style={[styles.sun, sunStyle]}>
          <SunnyMark size={MARK_SIZE} />
        </Animated.View>
      </View>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: RING_SIZE + 80,
    height: RING_SIZE + 80,
    borderRadius: (RING_SIZE + 80) / 2,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
  },
  stage: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringArc: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: BRAND.accentLight,
    borderRightColor: 'rgba(59, 130, 246, 0.35)',
  },
  ringArcSecondary: {
    width: RING_SIZE - 14,
    height: RING_SIZE - 14,
    borderRadius: (RING_SIZE - 14) / 2,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
    borderRightColor: 'transparent',
    transform: [{ rotate: '120deg' }],
  },
  rays: {
    position: 'absolute',
    width: MARK_SIZE + 8,
    height: MARK_SIZE + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raysGhost: {
    width: MARK_SIZE + 8,
    height: MARK_SIZE + 8,
    borderRadius: (MARK_SIZE + 8) / 2,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  sun: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BRAND.accentLight,
  },
});
