import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { BRAND, radius, spacing } from '@/theme/colors';

export function FormField({
  label,
  hint,
  ...inputProps
}: TextInputProps & {
  label: string;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        placeholderTextColor={BRAND.textMuted}
        {...inputProps}
        style={[styles.input, inputProps.multiline && styles.inputMultiline, inputProps.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.textMuted,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: BRAND.graphite,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});
