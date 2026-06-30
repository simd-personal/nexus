import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FileActionsSheet } from '@/components/FileActionsSheet';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { ProjectFileRow } from '@/components/ProjectFileRow';
import { ProjectUploadPanel } from '@/components/ProjectUploadPanel';
import { EmptyState, Screen } from '@/components/ui';
import { fetchProjectFiles, fetchProjectOverview } from '@/lib/api';
import { isFileProcessing } from '@/lib/files';
import type { ProjectFile } from '@/lib/types';
import { BRAND, spacing } from '@/theme/colors';

export default function ProjectFilesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';
  const queryClient = useQueryClient();

  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [actionsFile, setActionsFile] = useState<ProjectFile | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['project-overview', projectId],
    queryFn: () => fetchProjectOverview(projectId),
    enabled: Boolean(projectId),
  });

  const filesQuery = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: () => fetchProjectFiles(projectId),
    enabled: Boolean(projectId),
    refetchInterval: (query) => {
      const files = query.state.data?.files ?? [];
      return files.some((file) => isFileProcessing(file.status)) ? 3000 : false;
    },
  });

  const files = filesQuery.data?.files ?? [];
  const project = overviewQuery.data?.project;

  const invalidateFiles = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]);
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: project ? `${project.project_name} files` : 'Files' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={filesQuery.isFetching && !filesQuery.isLoading}
            onRefresh={() => void filesQuery.refetch()}
          />
        }
      >
        <ProjectUploadPanel projectId={projectId} existingFiles={files} />

        <Text style={styles.sectionTitle}>{files.length} file{files.length === 1 ? '' : 's'}</Text>

        {files.length === 0 ? (
          <EmptyState
            title="No files yet"
            body="Upload photos, PDFs, and documents. Sunny will read them and surface updates."
          />
        ) : (
          <View style={styles.list}>
            {files.map((file) => (
              <ProjectFileRow
                key={file.id}
                file={file}
                onPress={() => setPreviewFileId(file.id)}
                onActions={() => setActionsFile(file)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FilePreviewModal
        fileId={previewFileId}
        visible={Boolean(previewFileId)}
        onClose={() => setPreviewFileId(null)}
      />

      <FileActionsSheet
        file={actionsFile}
        projectId={projectId}
        visible={Boolean(actionsFile)}
        onClose={() => setActionsFile(null)}
        onView={() => {
          if (actionsFile) setPreviewFileId(actionsFile.id);
        }}
        onUpdated={() => void invalidateFiles()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
  },
  list: {
    gap: spacing.sm,
  },
});
