import { useLayoutEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SunnyMark } from '@/components/SunnyMark';
import { BRAND } from '@/theme/colors';

const MARK_SIZE = 112;
const ORBIT = MARK_SIZE + 48;

export function AnimatedSunnyLoader() {
  const orbit = useSharedValue(0);
  const float = useSharedValue(0);
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const reveal = useSharedValue(0);

  useLayoutEffect(() => {
    reveal.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    orbit.value = withRepeat(
      withTiming(360, { duration: 2800, easing: Easing.linear }),
      -1
    );
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [float, orbit, pulse, reveal, shimmer]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value}deg` }],
  }));

  const orbitStyleOffset = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value + 120}deg` }],
  }));

  const sunStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -6]) },
      { scale: interpolate(float.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: interpolate(pulse.value, [0.4, 1], [0.92, 1.08]) }],
  }));

  const amberGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.55]),
  }));

  return (
    <Animated.View style={[styles.wrap, revealStyle]} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <Animated.View style={[styles.blueGlow, glowStyle]} />
      <Animated.View style={[styles.amberGlow, amberGlowStyle]} />

      <View style={styles.stage}>
        <Animated.View style={[styles.orbitTrack, orbitStyle]}>
          <View style={styles.orbitDot} />
        </Animated.View>
        <Animated.View style={[styles.orbitTrack, orbitStyleOffset]}>
          <View style={[styles.orbitDot, styles.orbitDotSecondary]} />
        </Animated.View>
        <View style={styles.ring} />
        <Animated.View style={sunStyle}>
          <SunnyMark size={MARK_SIZE} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: ORBIT + 80,
    height: ORBIT + 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueGlow: {
    position: 'absolute',
    width: ORBIT + 60,
    height: ORBIT + 60,
    borderRadius: (ORBIT + 60) / 2,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },
  amberGlow: {
    position: 'absolute',
    width: MARK_SIZE + 40,
    height: MARK_SIZE + 40,
    borderRadius: (MARK_SIZE + 40) / 2,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  stage: {
    width: ORBIT,
    height: ORBIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: ORBIT,
    height: ORBIT,
    borderRadius: ORBIT / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  orbitTrack: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  orbitDot: {
    marginTop: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.accentLight,
    shadowColor: BRAND.accentLight,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitDotSecondary: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
    shadowColor: '#FBBF24',
  },
});
