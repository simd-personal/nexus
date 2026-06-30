import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BRAND, radius, spacing } from '@/theme/colors';

type InlineNoticeProps = {
  message: string;
  variant?: 'success' | 'error';
  onDismiss: () => void;
  autoHideMs?: number;
};

export function InlineNotice({
  message,
  variant = 'success',
  onDismiss,
  autoHideMs = 3500,
}: InlineNoticeProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [autoHideMs, message, onDismiss]);

  const isSuccess = variant === 'success';

  return (
    <View
      style={[styles.notice, isSuccess ? styles.noticeSuccess : styles.noticeError]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
        size={18}
        color={isSuccess ? BRAND.success : BRAND.danger}
      />
      <Text style={[styles.message, isSuccess ? styles.messageSuccess : styles.messageError]}>{message}</Text>
      <Pressable
        onPress={onDismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Ionicons name="close" size={16} color={BRAND.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noticeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  noticeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '500',
  },
  messageSuccess: {
    color: '#065F46',
  },
  messageError: {
    color: '#991B1B',
  },
});
