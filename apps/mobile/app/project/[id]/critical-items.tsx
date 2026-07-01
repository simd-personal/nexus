import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { CriticalItemRow } from '@/components/lists';
import { EmptyState, Screen } from '@/components/ui';
import { fetchProjectCriticalItems } from '@/lib/api';
import { spacing } from '@/theme/colors';

export default function ProjectCriticalItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';

  const query = useQuery({
    queryKey: ['project-critical-items', projectId],
    queryFn: () => fetchProjectCriticalItems(projectId),
    enabled: Boolean(projectId),
  });

  const items = query.data?.items ?? [];

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
          />
        }
      >
        {items.length === 0 ? (
          <EmptyState title="No critical items" body="Sunny has not flagged issues for this project." />
        ) : (
          items.map((item) => <CriticalItemRow key={item.id} item={item} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
