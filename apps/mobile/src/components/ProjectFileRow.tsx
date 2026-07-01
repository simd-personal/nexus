import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProjectFile } from '@/lib/types';
import { fileStatusLabel, fileStatusTone } from '@/lib/files';
import { formatFileUploadTime } from '@/lib/format';
import { APP, radius, spacing } from '@/theme/colors';

type ProjectFileRowProps = {
  file: ProjectFile;
  onPress: () => void;
  onActions: () => void;
};

const toneColors = {
  default: { bg: '#F3F4F6', text: '#4B5563' },
  success: { bg: '#ECFDF5', text: '#047857' },
  warning: { bg: '#FFFBEB', text: '#B45309' },
  danger: { bg: '#FEF2F2', text: '#B91C1C' },
};

export function ProjectFileRow({ file, onPress, onActions }: ProjectFileRowProps) {
  const tone = fileStatusTone(file.status);
  const colors = toneColors[tone];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.iconWrap}>
        <Feather name="file-text" size={20} color={APP.textMuted} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {file.file_name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {fileStatusLabel(file.status)}
            </Text>
          </View>
          <Text style={styles.meta}>Uploaded {formatFileUploadTime(file.created_at)}</Text>
        </View>
        {file.user_note ? (
          <Text style={styles.note} numberOfLines={2}>
            {file.user_note}
          </Text>
        ) : null}
        {file.origin_file_id ? (
          <Text style={styles.shared}>Shared copy</Text>
        ) : null}
      </View>
      <Pressable
        onPress={(event) => {
          event.stopPropagation?.();
          onActions();
        }}
        hitSlop={8}
        style={styles.moreBtn}
        accessibilityLabel={`Actions for ${file.file_name}`}
      >
        <Feather name="more-horizontal" size={20} color={APP.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: APP.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  rowPressed: {
    backgroundColor: APP.surfaceMuted,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP.btnSecondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: APP.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: APP.textMuted,
  },
  note: {
    fontSize: 12,
    color: APP.textMuted,
    lineHeight: 18,
  },
  shared: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
  },
  moreBtn: {
    padding: 4,
  },
});
