import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AnimatedSunnyLoader } from '@/components/AnimatedSunnyLoader';
import { UpperDeckIcon } from '@/components/UpperDeckLogo';
import { BRAND, spacing } from '@/theme/colors';

type LoadingScreenProps = {
  message?: string;
  submessage?: string;
};

export function LoadingScreen({
  message = 'Loading…',
  submessage,
}: LoadingScreenProps) {
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(8);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    textOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    textY.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [textOpacity, textY]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, [shimmer]);

  const lineStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [{ scaleX: 0.65 + shimmer.value * 0.35 }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0B1220', '#121D30', '#0B1220']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />

      <SafeAreaView style={styles.content} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.center}>
          <AnimatedSunnyLoader />

          <Animated.View style={[styles.copy, textStyle]}>
            <View style={styles.brandRow}>
              <UpperDeckIcon size={40} variant="dark" />
              <View>
                <Text style={styles.wordmark}>
                  UpperDeck<Text style={styles.wordmarkTld}>.dev</Text>
                </Text>
              </View>
            </View>
            <Animated.View style={[styles.accentLine, lineStyle]} />
            <Text style={styles.message}>{message}</Text>
            {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.bgPrimary,
  },
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  ambientTop: {
    position: 'absolute',
    top: -120,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -160,
    right: -80,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(245, 158, 11, 0.07)',
  },
  copy: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
    maxWidth: 300,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: BRAND.text,
  },
  wordmarkTld: {
    fontWeight: '400',
    color: BRAND.textSecondary,
  },
  accentLine: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: BRAND.accentLight,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  submessage: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textSecondary,
    textAlign: 'center',
  },
});
