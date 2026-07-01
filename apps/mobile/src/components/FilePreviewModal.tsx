import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchFilePreview, type FilePreviewResponse } from '@/lib/api';
import { APP, radius, spacing } from '@/theme/colors';

type FilePreviewModalProps = {
  fileId: string | null;
  visible: boolean;
  onClose: () => void;
};

export function FilePreviewModal({ fileId, visible, onClose }: FilePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const previewQuery = useQuery({
    queryKey: ['file-preview', fileId],
    queryFn: () => fetchFilePreview(fileId!),
    enabled: visible && Boolean(fileId),
  });

  const preview = previewQuery.data;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Feather name="x" size={22} color={APP.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {preview?.fileName ?? 'Preview'}
          </Text>
          <View style={styles.closeBtn} />
        </View>

        {previewQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={APP.text} />
            <Text style={styles.loadingText}>Loading preview…</Text>
          </View>
        ) : previewQuery.error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{(previewQuery.error as Error).message}</Text>
          </View>
        ) : preview ? (
          <PreviewBody preview={preview} />
        ) : null}
      </View>
    </Modal>
  );
}

function PreviewBody({ preview }: { preview: FilePreviewResponse }) {
  if (preview.viewType === 'image' && preview.url) {
    return (
      <ScrollView contentContainerStyle={styles.previewContent}>
        <Image source={{ uri: preview.url }} style={styles.image} resizeMode="contain" />
      </ScrollView>
    );
  }

  if (preview.viewType === 'pdf' && preview.url) {
    return (
      <View style={styles.centered}>
        <Ionicons name="document-text-outline" size={48} color={APP.textMuted} />
        <Text style={styles.openHint}>Open this PDF in your device viewer.</Text>
        <Pressable
          onPress={() => void Linking.openURL(preview.url!)}
          style={styles.openBtn}
        >
          <Text style={styles.openBtnText}>Open PDF</Text>
        </Pressable>
      </View>
    );
  }

  if (preview.viewType === 'spreadsheet' && preview.sheets?.length) {
    const sheet = preview.sheets[0];
    return (
      <ScrollView horizontal contentContainerStyle={styles.previewContent}>
        <ScrollView>
          {sheet.rows.slice(0, 100).map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.sheetRow}>
              {row.slice(0, 12).map((cell, cellIndex) => (
                <Text key={`cell-${rowIndex}-${cellIndex}`} style={styles.sheetCell} numberOfLines={2}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    );
  }

  const textContent = preview.text?.trim() || preview.html?.replace(/<[^>]+>/g, ' ').trim();
  if (textContent) {
    return (
      <ScrollView contentContainerStyle={styles.textContent}>
        <Text style={styles.textBody}>{textContent}</Text>
      </ScrollView>
    );
  }

  if (preview.url) {
    return (
      <View style={styles.centered}>
        <Text style={styles.openHint}>Preview is not available in-app for this file type.</Text>
        <Pressable onPress={() => void Linking.openURL(preview.url!)} style={styles.openBtn}>
          <Text style={styles.openBtnText}>Open file</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.openHint}>No preview available for this file yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: APP.text,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    color: APP.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  previewContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  image: {
    width: '100%',
    minHeight: 320,
  },
  openHint: {
    fontSize: 15,
    color: APP.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  openBtn: {
    backgroundColor: APP.btnPrimaryBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  openBtnText: {
    color: APP.btnPrimaryText,
    fontWeight: '600',
    fontSize: 15,
  },
  textContent: {
    padding: spacing.md,
  },
  textBody: {
    fontSize: 14,
    lineHeight: 22,
    color: APP.text,
  },
  sheetRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP.border,
  },
  sheetCell: {
    width: 120,
    padding: 8,
    fontSize: 12,
    color: APP.text,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: APP.border,
  },
});
