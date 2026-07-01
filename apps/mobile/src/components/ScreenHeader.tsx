import type { ReactNode } from 'react';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, spacing } from '@/theme/colors';

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={3}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightAction ? <View style={styles.actionsSlot}>{rightAction}</View> : null}
      </View>
    </View>
  );
}

export function HeaderIconButton({
  label,
  onPress,
  icon,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Slightly smaller touch target for native stack headers. */
  compact?: boolean;
}) {
  const dimension = compact ? 36 : 44;
  const iconSize = compact ? 20 : 22;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={compact ? 6 : 4}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        pressed && styles.iconBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon ? (
        <Ionicons name={icon} size={iconSize} color={BRAND.graphite} />
      ) : (
        <Text style={styles.iconBtnLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

export function HeaderActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: BRAND.cream,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  textBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: BRAND.graphite,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: BRAND.textMuted,
  },
  actionsSlot: {
    flexShrink: 0,
    paddingTop: 2,
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#0E1115',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtnPressed: {
    opacity: 0.75,
  },
  iconBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.textMuted,
  },
});
