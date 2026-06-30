import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ProjectRow } from '@/components/lists';
import { RefreshableScroll } from '@/components/RefreshableScroll';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState, Screen } from '@/components/ui';
import { fetchProjects } from '@/lib/api';

export default function ProjectsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const query = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });

  const projects = query.data?.projects ?? [];

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [query]);

  return (
    <Screen>
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={refresh}
        header={
          <ScreenHeader
            title="Projects"
            subtitle="Open a project to upload photos and review Sunny findings."
          />
        }
        contentContainerStyle={styles.list}
      >
        {projects.length === 0 && !query.isLoading ? (
          <EmptyState title="No projects yet" body="Create your first project on web, then manage it here on mobile." />
        ) : (
          projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onPress={() => router.push(`/project/${project.id}`)}
            />
          ))
        )}
      </RefreshableScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
