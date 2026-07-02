import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { fetchFilePreview, getFileRawImageSource, type FilePreviewResponse } from '@/lib/api';
import { APP, radius, spacing } from '@/theme/colors';

type FilePreviewModalProps = {
  fileId: string | null;
  visible: boolean;
  onClose: () => void;
};

type PreviewTab = 'original' | 'spreadsheet' | 'text';

function getTextContent(preview: FilePreviewResponse): string {
  return preview.text?.trim() || preview.html?.replace(/<[^>]+>/g, ' ').trim() || '';
}

function getAvailableTabs(preview: FilePreviewResponse): PreviewTab[] {
  const tabs: PreviewTab[] = [];
  if (
    (preview.viewType === 'image' && preview.hasOriginal) ||
    (preview.viewType === 'pdf' && preview.url)
  ) {
    tabs.push('original');
  }
  if (preview.viewType === 'spreadsheet' && preview.sheets?.length) {
    tabs.push('spreadsheet');
  }
  if (getTextContent(preview)) {
    tabs.push('text');
  }
  return tabs;
}

function tabLabel(tab: PreviewTab, preview: FilePreviewResponse): string {
  if (tab === 'original') return preview.viewType === 'pdf' ? 'PDF' : 'Image';
  if (tab === 'spreadsheet') return 'Spreadsheet';
  return 'Text';
}

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
        ) : preview && fileId ? (
          <PreviewBody key={fileId} fileId={fileId} preview={preview} />
        ) : null}
      </View>
    </Modal>
  );
}

function PreviewBody({ fileId, preview }: { fileId: string; preview: FilePreviewResponse }) {
  const tabs = getAvailableTabs(preview);
  const [tab, setTab] = useState<PreviewTab>(tabs[0] ?? 'text');

  // Preview data can arrive after mount (query refetch); keep the tab valid.
  useEffect(() => {
    if (tabs.length && !tabs.includes(tab)) {
      setTab(tabs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.join('|')]);

  if (!tabs.length) {
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
        <Text style={styles.openHint}>
          {preview.status === 'processing' || preview.status === 'pending'
            ? 'Sunny is still reading this file. Check back in a moment.'
            : 'No preview available for this file yet.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {tabs.length > 1 ? (
        <View style={styles.tabBar}>
          {tabs.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {tabLabel(t, preview)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {tab === 'original' ? (
        preview.viewType === 'image' ? (
          <ImagePreview fileId={fileId} preview={preview} />
        ) : (
          <View style={styles.centered}>
            <Ionicons name="document-text-outline" size={48} color={APP.textMuted} />
            <Text style={styles.openHint}>Open this PDF in your device viewer.</Text>
            <Pressable onPress={() => void Linking.openURL(preview.url!)} style={styles.openBtn}>
              <Text style={styles.openBtnText}>Open PDF</Text>
            </Pressable>
          </View>
        )
      ) : tab === 'spreadsheet' ? (
        <SpreadsheetPreview preview={preview} />
      ) : (
        <ScrollView contentContainerStyle={styles.textContent}>
          <Text style={styles.textBody} selectable>
            {getTextContent(preview)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function SpreadsheetPreview({ preview }: { preview: FilePreviewResponse }) {
  const sheet = preview.sheets?.[0];
  if (!sheet) return null;
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

function ImagePreview({ fileId, preview }: { fileId: string; preview: FilePreviewResponse }) {
  const [loaded, setLoaded] = useState(false);
  const [triedSignedUrl, setTriedSignedUrl] = useState(false);
  const [failed, setFailed] = useState(false);

  const sourceQuery = useQuery({
    queryKey: ['file-raw-source', fileId],
    queryFn: () => getFileRawImageSource(fileId),
    staleTime: 60_000,
  });

  // Prefer the authenticated API endpoint (reachable wherever the API is);
  // fall back to the Supabase signed URL if that load fails.
  const source =
    triedSignedUrl && preview.url ? { uri: preview.url } : sourceQuery.data ?? null;

  if (failed) {
    return (
      <View style={styles.centered}>
        <Ionicons name="image-outline" size={48} color={APP.textMuted} />
        <Text style={styles.openHint}>Could not load this image. Check your connection and try again.</Text>
      </View>
    );
  }

  if (!source) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={APP.text} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.previewContent}>
      <View style={styles.imageWrap}>
        <Image
          source={source}
          style={styles.image}
          resizeMode="contain"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!triedSignedUrl && preview.url) {
              setLoaded(false);
              setTriedSignedUrl(true);
            } else {
              setFailed(true);
            }
          }}
        />
        {!loaded ? (
          <View style={styles.imageLoading} pointerEvents="none">
            <ActivityIndicator color={APP.text} />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP.canvas,
  },
  flex: {
    flex: 1,
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
  tabBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: APP.btnSecondaryBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  tabBtnActive: {
    backgroundColor: APP.btnPrimaryBg,
    borderColor: APP.btnPrimaryBg,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.textMuted,
  },
  tabLabelActive: {
    color: APP.btnPrimaryText,
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
  imageWrap: {
    flex: 1,
    minHeight: 320,
  },
  image: {
    width: '100%',
    flex: 1,
    minHeight: 320,
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
