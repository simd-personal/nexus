import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BRAND } from '@/theme/colors';

const INDETERMINATE_LABELS = [
  'Warming up Sunny…',
  'Stretching sunbeams…',
  'Dusting off the deck…',
  'Almost ready…',
];

const AnimatedText = Animated.createAnimatedComponent(Text);
const TRACK_WIDTH = 240;
const SPARK_COUNT = 5;

type SunnyLoadProgressProps = {
  /** 0–1 when known; null for playful indeterminate crawl. */
  progress?: number | null;
  statusLabel?: string;
};

export function SunnyLoadProgress({ progress = null, statusLabel }: SunnyLoadProgressProps) {
  const target = useSharedValue(progress ?? 0.08);
  const shimmer = useSharedValue(0);
  const pulse = useSharedValue(0);
  const [labelIndex, setLabelIndex] = useState(0);
  const labelOpacity = useSharedValue(1);

  useEffect(() => {
    if (progress == null) {
      target.value = withRepeat(
        withSequence(
          withTiming(0.88, { duration: 2800, easing: Easing.inOut(Easing.cubic) }),
          withTiming(0.12, { duration: 400, easing: Easing.out(Easing.cubic) })
        ),
        -1,
        false
      );
      return;
    }

    target.value = withTiming(Math.min(Math.max(progress, 0.04), 1), {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, target]);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [pulse, shimmer]);

  useEffect(() => {
    if (progress != null || statusLabel) return;

    const interval = setInterval(() => {
      labelOpacity.value = withSequence(
        withTiming(0, { duration: 180 }),
        withTiming(1, { duration: 280 })
      );
      setLabelIndex((current) => (current + 1) % INDETERMINATE_LABELS.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [labelOpacity, progress, statusLabel]);

  const fillStyle = useAnimatedStyle(() => ({
    width: interpolate(target.value, [0, 1], [8, TRACK_WIDTH]),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmer.value, [0, 1], [-TRACK_WIDTH * 0.4, TRACK_WIDTH * 0.9]),
      },
    ],
    opacity: interpolate(shimmer.value, [0, 0.4, 1], [0, 0.85, 0]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const displayLabel =
    statusLabel ?? (progress == null ? INDETERMINATE_LABELS[labelIndex] : 'Loading your workspace…');

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel={displayLabel}>
      <View style={styles.sparkRow}>
        {Array.from({ length: SPARK_COUNT }, (_, index) => (
          <SparkDot key={index} index={index} progress={target} pulse={pulse} />
        ))}
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fillWrap, fillStyle]}>
          <LinearGradient
            colors={['#2563EB', '#3B82F6', '#F59E0B']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.fill}
          />
          <Animated.View style={[styles.shimmer, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </View>

      <AnimatedText style={[styles.label, labelStyle]} numberOfLines={1}>
        {displayLabel}
      </AnimatedText>
    </View>
  );
}

function SparkDot({
  index,
  progress,
  pulse,
}: {
  index: number;
  progress: SharedValue<number>;
  pulse: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const threshold = (index + 1) / SPARK_COUNT;
    const lit = progress.value >= threshold - 0.08;
    return {
      opacity: lit ? interpolate(pulse.value, [0.35, 1], [0.55, 1]) : 0.22,
      transform: [
        {
          scale: lit ? interpolate(pulse.value, [0.35, 1], [1, 1.35]) : 0.85,
        },
      ],
      backgroundColor: lit
        ? index % 2 === 0
          ? BRAND.accentLight
          : '#FBBF24'
        : 'rgba(148, 163, 184, 0.35)',
    };
  });

  return <Animated.View style={[styles.spark, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    width: TRACK_WIDTH,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  spark: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  track: {
    width: TRACK_WIDTH,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    borderRadius: 999,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
