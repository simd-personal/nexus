import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet } from 'react-native';
import { SunnyHandoffCard } from '@/components/project/SunnyHandoffCard';
import { Screen } from '@/components/ui';
import { fetchProjectOverview } from '@/lib/api';
import { spacing } from '@/theme/colors';

export default function ProjectSearchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';

  const overviewQuery = useQuery({
    queryKey: ['project-overview', projectId],
    queryFn: () => fetchProjectOverview(projectId),
    enabled: Boolean(projectId),
  });

  const project = overviewQuery.data?.project;
  const projectName = project ? `${project.client_name} · ${project.project_name}` : 'this project';

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SunnyHandoffCard
          projectId={projectId}
          projectName={projectName}
          title="Search project materials"
          body="Open Sunny scoped to {project} and ask evidence-backed questions across uploaded files."
          icon="search-outline"
        />
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
