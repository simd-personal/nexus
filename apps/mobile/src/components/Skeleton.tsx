import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { BRAND, radius } from '@/theme/colors';

export function SkeletonBlock({
  height,
  width = '100%',
  style,
}: {
  height: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.block, { height, width, opacity }, style]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.statsGrid}>
        <SkeletonBlock height={88} style={styles.stat} />
        <SkeletonBlock height={88} style={styles.stat} />
        <SkeletonBlock height={88} style={styles.stat} />
        <SkeletonBlock height={88} style={styles.stat} />
      </View>
      <SkeletonBlock height={18} width="40%" style={styles.sectionLabel} />
      <SkeletonBlock height={120} style={styles.card} />
      <SkeletonBlock height={120} style={styles.card} />
      <SkeletonBlock height={18} width="50%" style={styles.sectionLabel} />
      <SkeletonBlock height={140} style={styles.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E5E7EB',
    borderRadius: radius.md,
  },
  dashboard: {
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    width: '48%',
    flexGrow: 1,
  },
  sectionLabel: {
    marginTop: 8,
  },
  card: {
    borderRadius: radius.lg,
  },
});
