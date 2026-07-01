import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ProjectTimelineView } from '@/components/project/ProjectTimelineView';
import { Screen } from '@/components/ui';
import { fetchProjectTimeline } from '@/lib/api';
import { spacing } from '@/theme/colors';

export default function ProjectTimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';

  const timelineQuery = useQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: () => fetchProjectTimeline(projectId),
    enabled: Boolean(projectId),
  });

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={timelineQuery.isFetching && !timelineQuery.isLoading}
            onRefresh={() => void timelineQuery.refetch()}
          />
        }
      >
        <ProjectTimelineView events={timelineQuery.data?.events ?? []} expandable />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});
