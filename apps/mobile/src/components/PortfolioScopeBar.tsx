import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DashboardPortfolioScope } from '@/lib/types';
import { BRAND, spacing } from '@/theme/colors';

const OPTIONS: { value: DashboardPortfolioScope; label: string }[] = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'all', label: 'All projects' },
];

export function PortfolioScopeBar({
  scope,
  onScopeChange,
  disabled,
}: {
  scope: DashboardPortfolioScope;
  onScopeChange: (scope: DashboardPortfolioScope) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="Portfolio scope">
      {OPTIONS.map((option) => {
        const active = scope === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onScopeChange(option.value)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [styles.option, pressed && !disabled && styles.optionPressed]}
          >
            <View style={[styles.radio, active && styles.radioActive]}>
              {active ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  optionPressed: {
    opacity: 0.75,
  },
  radio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: BRAND.accent,
    backgroundColor: '#EFF6FF',
    shadowColor: BRAND.accent,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.accent,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  labelActive: {
    fontWeight: '600',
    color: BRAND.graphite,
  },
});
