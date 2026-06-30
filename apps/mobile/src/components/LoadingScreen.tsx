import { StyleSheet, Text, View } from 'react-native';
import { AnimatedSunnyLoader } from '@/components/AnimatedSunnyLoader';
import { BRAND, spacing } from '@/theme/colors';

type LoadingScreenProps = {
  message?: string;
  submessage?: string;
};

export function LoadingScreen({
  message = 'Loading…',
  submessage,
}: LoadingScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.backdropTop} />
      <View style={styles.backdropBottom} />

      <AnimatedSunnyLoader />

      <Text style={styles.brand}>UpperDeck</Text>
      <Text style={styles.message}>{message}</Text>
      {submessage ? <Text style={styles.submessage}>{submessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.bgPrimary,
    paddingHorizontal: spacing.lg,
  },
  backdropTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  backdropBottom: {
    position: 'absolute',
    bottom: -120,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  brand: {
    marginTop: spacing.lg,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: BRAND.textSecondary,
  },
  message: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '600',
    color: BRAND.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  submessage: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: BRAND.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
