import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { replaceProjectFile, uploadProjectFile } from '@/lib/api';
import { findFileByUploadName } from '@/lib/files';
import type { ProjectFile } from '@/lib/types';
import { BRAND, radius, spacing } from '@/theme/colors';

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
      Alert.alert('Uploaded', 'Sunny is processing your file.');
    },
    onError: (error: Error) => Alert.alert('Upload failed', error.message),
  });

  const replaceMutation = useMutation({
    mutationFn: ({ fileId, file }: { fileId: string; file: PendingUpload }) =>
      replaceProjectFile(fileId, file.uri, file.fileName, file.mimeType),
    onSuccess: async () => {
      setPending(null);
      setNote('');
      await invalidateProjectFiles();
      Alert.alert('Replaced', 'Sunny is reprocessing the updated file.');
    },
    onError: (error: Error) => Alert.alert('Replace failed', error.message),
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

  async function pickPhoto(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera or photo access to add pictures.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.85,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      setPending({
        uri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        preview: true,
      });
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPending({
      uri: asset.uri,
      fileName: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      preview: asset.mimeType?.startsWith('image/'),
    });
  }

  const busy = uploadMutation.isPending || replaceMutation.isPending;

  return (
    <Card>
      <Text style={styles.title}>Add materials</Text>
      <Text style={styles.body}>
        Upload photos, PDFs, spreadsheets, and other files. Sunny will read them and surface updates.
      </Text>

      <View style={styles.actions}>
        <UploadAction icon="camera-outline" label="Camera" onPress={() => void pickPhoto(true)} />
        <UploadAction icon="images-outline" label="Photos" onPress={() => void pickPhoto(false)} />
        <UploadAction icon="document-outline" label="Files" onPress={() => void pickDocument()} />
      </View>

      {pending ? (
        <View style={styles.pending}>
          {pending.preview ? (
            <Image source={{ uri: pending.uri }} style={styles.preview} />
          ) : (
            <View style={styles.filePreview}>
              <Ionicons name="document-text-outline" size={28} color={BRAND.accent} />
              <Text style={styles.fileName} numberOfLines={2}>
                {pending.fileName}
              </Text>
            </View>
          )}

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note for Sunny…"
            placeholderTextColor={BRAND.textMuted}
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
    </Card>
  );
}

function UploadAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={BRAND.accent} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.textMuted,
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
    borderRadius: radius.lg,
    backgroundColor: BRAND.stone,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  pending: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: '#E5E7EB',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: BRAND.stone,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: BRAND.graphite,
    minHeight: 44,
  },
});
