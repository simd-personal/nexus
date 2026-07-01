import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AskSunnyProjectCard } from '@/components/AskSunnyProjectCard';
import { FileActionsSheet } from '@/components/FileActionsSheet';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { EmailForwardPanel } from '@/components/EmailForwardPanel';
import { ProjectFileRow } from '@/components/ProjectFileRow';
import { ProjectUploadPanel } from '@/components/ProjectUploadPanel';
import { CriticalItemRow } from '@/components/lists';
import { EmptyState, Screen, StatPill, Subtitle } from '@/components/ui';
import { fetchProjectFiles, fetchProjectOverview } from '@/lib/api';
import type { CriticalItem, ProjectFile } from '@/lib/types';
import { BRAND, spacing } from '@/theme/colors';

export default function ProjectDetailScreen() {
  const router = useRouter();
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
  });

  const project = overviewQuery.data?.project;
  const stats = overviewQuery.data?.stats;
  const files = filesQuery.data?.files ?? [];

  async function refreshAll() {
    await Promise.all([overviewQuery.refetch(), filesQuery.refetch()]);
  }

  async function invalidateFiles() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['project-overview', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]);
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: project?.project_name ?? 'Project' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={overviewQuery.isFetching} onRefresh={() => void refreshAll()} />
        }
      >
        {project ? (
          <>
            <View style={styles.header}>
              <Text style={styles.client}>{project.client_name}</Text>
              <Subtitle>{project.last_summary ?? 'No summary yet. Add files and Sunny will summarize.'}</Subtitle>
            </View>

            <View style={styles.statsRow}>
              <StatPill label="Files" value={stats?.file_count ?? 0} />
              <StatPill label="Critical" value={stats?.critical_item_count ?? 0} tone="danger" />
              <StatPill label="Actions" value={stats?.action_item_count ?? 0} />
            </View>

            <AskSunnyProjectCard
              projectId={projectId}
              projectName={`${project.client_name} · ${project.project_name}`}
            />

            <ProjectUploadPanel projectId={projectId} existingFiles={files} />

            <EmailForwardPanel mode="project" projectId={projectId} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent files</Text>
              {files.length > 0 ? (
                <Pressable onPress={() => router.push(`/project/${projectId}/files`)}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              ) : null}
            </View>

            {files.length === 0 ? (
              <EmptyState
                title="No files yet"
                body="Take a photo or upload documents to get Sunny started."
              />
            ) : (
              files.slice(0, 5).map((file) => (
                <ProjectFileRow
                  key={file.id}
                  file={file}
                  onPress={() => setPreviewFileId(file.id)}
                  onActions={() => setActionsFile(file)}
                />
              ))
            )}

            <Text style={styles.sectionTitle}>Critical items</Text>
            {(overviewQuery.data?.critical_items ?? []).length === 0 ? (
              <EmptyState title="No critical items" body="Sunny has not flagged issues for this project." />
            ) : (
              (overviewQuery.data?.critical_items ?? []).map((item: CriticalItem) => (
                <CriticalItemRow key={item.id} item={item} />
              ))
            )}
          </>
        ) : overviewQuery.isLoading ? (
          <Text style={styles.loading}>Loading project…</Text>
        ) : (
          <EmptyState title="Project not found" body="This project may have been deleted." />
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
  header: {
    gap: spacing.xs,
  },
  client: {
    fontSize: 14,
    color: BRAND.textMuted,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BRAND.graphite,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.accent,
  },
  loading: {
    textAlign: 'center',
    color: BRAND.textMuted,
    marginTop: spacing.xl,
  },
});
