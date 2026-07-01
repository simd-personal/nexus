import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  deleteProjectFile,
  fetchAllProjects,
  moveProjectFile,
  patchProjectFile,
  removeProjectFile,
  reprocessProjectFile,
  replaceProjectFile,
  shareProjectFile,
} from '@/lib/api';
import type { ProjectFile, ProjectWithStats } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

type DialogMode = 'rename' | 'note' | 'move' | 'share' | 'remove' | null;

type FileActionsSheetProps = {
  file: ProjectFile | null;
  projectId: string;
  visible: boolean;
  onClose: () => void;
  onView?: () => void;
  onUpdated: () => void;
};

function flattenProjects(projects: ProjectWithStats[]): ProjectWithStats[] {
  const out: ProjectWithStats[] = [];
  for (const project of projects) {
    out.push(project);
    for (const child of project.sub_projects ?? []) {
      out.push(child);
    }
  }
  return out;
}

export function FileActionsSheet({
  file,
  projectId,
  visible,
  onClose,
  onView,
  onUpdated,
}: FileActionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<DialogMode>(null);
  const [value, setValue] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const projectsQuery = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: fetchAllProjects,
    enabled: visible && (mode === 'move' || mode === 'share'),
  });

  const otherProjects = flattenProjects(projectsQuery.data?.projects ?? []).filter(
    (project) => project.id !== projectId
  );

  function closeAll() {
    setMode(null);
    setError('');
    onClose();
  }

  function startDialog(nextMode: DialogMode) {
    if (!file) return;
    setMode(nextMode);
    setError('');
    setValue(nextMode === 'rename' ? file.file_name : nextMode === 'note' ? file.user_note ?? '' : '');
    setTargetProjectId('');
  }

  async function handleReplace() {
    if (!file) return;
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setSubmitting(true);
    setError('');
    try {
      await replaceProjectFile(
        file.id,
        asset.uri,
        asset.name,
        asset.mimeType ?? 'application/octet-stream'
      );
      onUpdated();
      closeAll();
      Alert.alert('Replaced', 'Sunny is reprocessing the updated file.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!file) return;
    Alert.alert('Delete file?', `Permanently delete “${file.file_name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSubmitting(true);
            try {
              await deleteProjectFile(file.id);
              onUpdated();
              closeAll();
            } catch (err) {
              Alert.alert('Delete failed', (err as Error).message);
            } finally {
              setSubmitting(false);
            }
          })();
        },
      },
    ]);
  }

  async function handleReprocess() {
    if (!file) return;
    setSubmitting(true);
    try {
      await reprocessProjectFile(file.id);
      onUpdated();
      closeAll();
      Alert.alert('Reprocessing', 'Sunny is re-reading this file.');
    } catch (err) {
      Alert.alert('Reprocess failed', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDialog() {
    if (!file || !mode) return;
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'rename') {
        await patchProjectFile(file.id, { file_name: value.trim() });
      } else if (mode === 'note') {
        await patchProjectFile(file.id, { user_note: value.trim() || null });
      } else if (mode === 'move') {
        if (!targetProjectId) {
          setError('Choose a project');
          return;
        }
        await moveProjectFile(file.id, targetProjectId);
      } else if (mode === 'share') {
        if (!targetProjectId) {
          setError('Choose a project');
          return;
        }
        await shareProjectFile(file.id, targetProjectId);
      } else if (mode === 'remove') {
        await removeProjectFile(file.id, projectId);
      }
      setMode(null);
      onUpdated();
      closeAll();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!file) return null;

  return (
    <>
      <Modal visible={visible && !mode} transparent animationType="fade" onRequestClose={closeAll}>
        <Pressable style={styles.backdrop} onPress={closeAll}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]} onPress={() => {}}>
            <Text style={styles.fileName} numberOfLines={2}>
              {file.file_name}
            </Text>
            <ActionRow icon="eye" label="View file" onPress={() => { onClose(); onView?.(); }} />
            <ActionRow icon="upload" label="Replace file" onPress={() => void handleReplace()} />
            {(file.status === 'failed' || file.status === 'uploaded_unprocessed') && (
              <ActionRow icon="refresh-cw" label="Reprocess" onPress={() => void handleReprocess()} />
            )}
            <ActionRow icon="edit-2" label="Rename file" onPress={() => startDialog('rename')} />
            <ActionRow icon="file-text" label="Add note or context" onPress={() => startDialog('note')} />
            <ActionRow icon="folder" label="Move to project" onPress={() => startDialog('move')} />
            <ActionRow icon="link" label="Share with project" onPress={() => startDialog('share')} />
            <ActionRow
              icon="trash-2"
              label="Remove from project"
              onPress={() => startDialog('remove')}
              danger
            />
            <ActionRow icon="trash" label="Delete file permanently" onPress={() => void handleDelete()} danger />
            {submitting ? <ActivityIndicator style={{ marginTop: spacing.sm }} color={APP.text} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable onPress={closeAll} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={Boolean(mode)} transparent animationType="fade" onRequestClose={() => setMode(null)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              {mode === 'rename' && 'Rename file'}
              {mode === 'note' && 'Add note or context'}
              {mode === 'move' && 'Move to another project'}
              {mode === 'share' && 'Share with another project'}
              {mode === 'remove' && 'Remove from this project'}
            </Text>
            <Text style={styles.dialogSubtitle} numberOfLines={2}>
              {file.file_name}
            </Text>

            {(mode === 'rename' || mode === 'note') && (
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder={mode === 'rename' ? 'New file name' : 'Optional context for Sunny'}
                placeholderTextColor={APP.textSubtle}
                style={mode === 'note' ? styles.textArea : styles.input}
                multiline={mode === 'note'}
              />
            )}

            {(mode === 'move' || mode === 'share') && (
              <ScrollView style={styles.projectList}>
                {projectsQuery.isLoading ? (
                  <ActivityIndicator color={APP.text} />
                ) : (
                  otherProjects.map((project) => {
                    const active = targetProjectId === project.id;
                    return (
                      <Pressable
                        key={project.id}
                        onPress={() => setTargetProjectId(project.id)}
                        style={[styles.projectOption, active && styles.projectOptionActive]}
                      >
                        <Text style={styles.projectOptionText}>
                          {project.client_name} · {project.project_name}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}

            {mode === 'remove' && (
              <Text style={styles.removeHint}>
                {file.origin_file_id
                  ? 'Removes the shared copy from this project. The original stays in its source project.'
                  : 'Removes the file from this project and deletes its indexed content here.'}
              </Text>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.dialogActions}>
              <Pressable onPress={() => setMode(null)} style={styles.dialogBtn}>
                <Text style={styles.dialogBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void submitDialog()}
                disabled={submitting}
                style={[styles.dialogBtn, styles.dialogBtnPrimary]}
              >
                <Text style={styles.dialogBtnPrimaryText}>
                  {mode === 'remove' ? 'Remove' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <Feather name={icon} size={18} color={danger ? '#DC2626' : APP.text} />
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: APP.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: 2,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.textMuted,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
  },
  actionLabel: {
    fontSize: 16,
    color: APP.text,
  },
  actionLabelDanger: {
    color: '#DC2626',
  },
  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: APP.textMuted,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: APP.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: APP.text,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: APP.textMuted,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: APP.text,
    marginTop: spacing.sm,
  },
  textArea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.borderStrong,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: APP.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: spacing.sm,
  },
  projectList: {
    maxHeight: 200,
    marginTop: spacing.sm,
  },
  projectOption: {
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  projectOptionActive: {
    backgroundColor: APP.btnSecondaryBg,
  },
  projectOptionText: {
    fontSize: 14,
    color: APP.text,
  },
  removeHint: {
    fontSize: 14,
    lineHeight: 20,
    color: APP.textMuted,
    marginTop: spacing.sm,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dialogBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dialogBtnText: {
    fontSize: 15,
    color: APP.textMuted,
  },
  dialogBtnPrimary: {
    backgroundColor: APP.btnPrimaryBg,
    borderRadius: radius.sm,
  },
  dialogBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: APP.btnPrimaryText,
  },
});
