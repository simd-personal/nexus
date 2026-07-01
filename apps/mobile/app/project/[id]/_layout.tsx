import { Stack, useGlobalSearchParams } from 'expo-router';
import { ProjectStackChrome } from '@/components/project/ProjectStackChrome';
import { BRAND } from '@/theme/colors';

export default function ProjectLayout() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => <ProjectStackChrome projectId={projectId} />,
        contentStyle: { backgroundColor: BRAND.cream },
      }}
    />
  );
}
