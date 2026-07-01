import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { APP, radius, spacing } from '@/theme/colors';

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
        placeholderTextColor={APP.textSubtle}
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
    color: APP.text,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: APP.textMuted,
  },
  input: {
    backgroundColor: APP.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: APP.text,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});
