import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { APP, radius, spacing } from '@/theme/colors';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Safe area edges to respect. Tab screens should omit bottom (tab bar handles it). */
  edges?: Edge[];
};

export function Screen({ children, style, edges = ['top', 'left', 'right'] }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'compact';
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === 'compact' && styles.buttonCompact,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && !loading && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? APP.btnPrimaryText : APP.textMuted} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            size === 'compact' && styles.buttonLabelCompact,
            variant !== 'primary' && styles.buttonLabelSecondary,
            variant === 'ghost' && styles.buttonLabelGhost,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function StatPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'danger' | 'accent';
}) {
  return (
    <View
      style={[
        styles.statPill,
        tone === 'danger' && styles.statPillDanger,
        tone === 'accent' && styles.statPillAccent,
      ]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const tone =
    severity === 'critical' || severity === 'high'
      ? styles.badgeDanger
      : severity === 'medium'
        ? styles.badgeWarning
        : styles.badgeNeutral;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{severity}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: APP.canvas,
  },
  card: {
    backgroundColor: APP.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    gap: spacing.sm,
    shadowColor: '#111418',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: APP.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: APP.textMuted,
  },
  button: {
    backgroundColor: APP.btnPrimaryBg,
    borderRadius: radius.sm,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonCompact: {
    alignSelf: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.lg,
  },
  buttonSecondary: {
    backgroundColor: APP.btnSecondaryBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.btnSecondaryBorder,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonLabel: {
    color: APP.btnPrimaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonLabelCompact: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  buttonLabelSecondary: {
    color: APP.btnSecondaryText,
  },
  buttonLabelGhost: {
    color: APP.textMuted,
  },
  statPill: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: APP.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    shadowColor: '#111418',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statPillDanger: {
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  statPillAccent: {
    borderLeftWidth: 3,
    borderLeftColor: APP.accent,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: APP.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: APP.textMuted,
  },
  empty: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP.text,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeNeutral: {
    backgroundColor: APP.btnSecondaryBg,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP.text,
    textTransform: 'capitalize',
  },
});
