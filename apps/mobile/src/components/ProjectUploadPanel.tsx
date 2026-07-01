import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InlineNotice } from '@/components/InlineNotice';
import { Button, Card } from '@/components/ui';
import { replaceProjectFile, uploadProjectFile } from '@/lib/api';
import { findFileByUploadName } from '@/lib/files';
import { prepareUploadFile } from '@/lib/prepare-upload-file';
import type { ProjectFile } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

type PendingUpload = {
  uri: string;
  fileName: string;
  mimeType: string;
  preview?: boolean;
};

type ProjectUploadPanelProps = {
  projectId: string;
  existingFiles?: ProjectFile[];
};

export function ProjectUploadPanel({ projectId, existingFiles = [] }: ProjectUploadPanelProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [notice, setNotice] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const [preparing, setPreparing] = useState(false);

  const dismissNotice = useCallback(() => setNotice(null), []);

  async function invalidateProjectFiles() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
    ]);
  }

  const uploadMutation = useMutation({
    mutationFn: (file: PendingUpload) =>
      uploadProjectFile(projectId, file.uri, file.fileName, file.mimeType, note),
    onSuccess: async () => {
      setPending(null);
      setNote('');
      await invalidateProjectFiles();
      setNotice({ message: 'Uploaded. Sunny is processing your file.', variant: 'success' });
    },
    onError: (error: Error) => {
      setNotice({ message: error.message || 'Upload failed.', variant: 'error' });
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ fileId, file }: { fileId: string; file: PendingUpload }) =>
      replaceProjectFile(fileId, file.uri, file.fileName, file.mimeType),
    onSuccess: async () => {
      setPending(null);
      setNote('');
      await invalidateProjectFiles();
      setNotice({ message: 'File replaced. Sunny is reprocessing it.', variant: 'success' });
    },
    onError: (error: Error) => {
      setNotice({ message: error.message || 'Replace failed.', variant: 'error' });
    },
  });

  function performUpload(file: PendingUpload, replaceExistingId?: string) {
    if (replaceExistingId) {
      replaceMutation.mutate({ fileId: replaceExistingId, file });
      return;
    }
    uploadMutation.mutate(file);
  }

  function confirmUpload(file: PendingUpload) {
    const existing = findFileByUploadName(existingFiles, file.fileName);
    if (!existing) {
      performUpload(file);
      return;
    }

    Alert.alert(
      'File already exists',
      `"${file.fileName}" is already in this project.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add separate copy',
          onPress: () => performUpload(file),
        },
        {
          text: 'Replace existing',
          onPress: () => performUpload(file, existing.id),
        },
      ]
    );
  }

  async function stageUpload(uri: string, fileName: string, mimeType: string, preview: boolean) {
    setPreparing(true);
    try {
      const prepared = await prepareUploadFile(uri, fileName, mimeType);
      setPending({
        uri: prepared.uri,
        fileName: prepared.fileName,
        mimeType: prepared.mimeType,
        preview,
      });
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : 'Could not prepare that file.',
        variant: 'error',
      });
    } finally {
      setPreparing(false);
    }
  }

  async function pickPhoto(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera or photo access to add pictures.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 1,
          exif: false,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 1,
          exif: false,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      await stageUpload(
        asset.uri,
        asset.fileName ?? `photo-${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg',
        true
      );
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const preview = asset.mimeType?.startsWith('image/') ?? false;
    await stageUpload(
      asset.uri,
      asset.name,
      asset.mimeType ?? 'application/octet-stream',
      preview
    );
  }

  const busy = uploadMutation.isPending || replaceMutation.isPending;

  return (
    <Card>
      <Text style={styles.title}>Add materials</Text>
      <Text style={styles.body}>
        Upload photos, PDFs, spreadsheets, and other files. Sunny will read them and surface updates.
      </Text>

      {notice ? (
        <InlineNotice message={notice.message} variant={notice.variant} onDismiss={dismissNotice} />
      ) : null}

      {preparing ? <Text style={styles.preparing}>Preparing photo…</Text> : null}

      <View style={styles.actions}>
        <UploadAction icon="camera-outline" label="Camera" onPress={() => void pickPhoto(true)} disabled={preparing || busy} />
        <UploadAction icon="images-outline" label="Photos" onPress={() => void pickPhoto(false)} disabled={preparing || busy} />
        <UploadAction icon="document-outline" label="Files" onPress={() => void pickDocument()} disabled={preparing || busy} />
      </View>

      {pending ? (
        <View style={styles.pending}>
          {pending.preview ? (
            <Image source={{ uri: pending.uri }} style={styles.preview} />
          ) : (
            <View style={styles.filePreview}>
              <Ionicons name="document-text-outline" size={28} color={APP.textMuted} />
              <Text style={styles.fileName} numberOfLines={2}>
                {pending.fileName}
              </Text>
            </View>
          )}

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note for Sunny…"
            placeholderTextColor={APP.textSubtle}
            style={styles.noteInput}
            multiline
          />

          <Button
            label="Upload to project"
            onPress={() => confirmUpload(pending)}
            loading={busy}
          />
          <Button label="Cancel" variant="ghost" onPress={() => setPending(null)} />
        </View>
      ) : null}

      <View style={styles.securityNote}>
        <Ionicons name="lock-closed-outline" size={14} color="#047857" />
        <Text style={styles.securityText}>
          Files upload to encrypted private storage scoped to your account. Sunny reads them only to
          answer your questions, not to train models.
        </Text>
      </View>
    </Card>
  );
}

function UploadAction({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.actionPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={APP.textMuted} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: APP.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: APP.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  preparing: {
    fontSize: 14,
    color: APP.textMuted,
    textAlign: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP.btnSecondaryBg,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.text,
  },
  pending: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: APP.btnSecondaryBg,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: APP.surfaceMuted,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: APP.text,
  },
  noteInput: {
    backgroundColor: APP.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: APP.text,
    minHeight: 44,
  },
  securityNote: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#A7F3D0',
    padding: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#065F46',
  },
});
