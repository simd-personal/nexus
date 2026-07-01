import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet } from 'react-native';
import { ProjectGeneratePanel } from '@/components/project/ProjectGeneratePanel';
import { Screen } from '@/components/ui';
import { fetchProjectOverview } from '@/lib/api';
import { spacing } from '@/theme/colors';

export default function ProjectFollowUpScreen() {
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
        <ProjectGeneratePanel
          projectId={projectId}
          type="follow_up_email"
          title="Follow up email"
          description={`Draft a client-ready follow up for ${projectName}. Pick a tone, add optional instructions, then copy the result.`}
          showVersionPills
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
