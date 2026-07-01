import { Tabs, useGlobalSearchParams } from 'expo-router';
import { ProjectStackChrome } from '@/components/project/ProjectStackChrome';
import { APP } from '@/theme/colors';

export default function ProjectLayout() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const projectId = typeof id === 'string' ? id : '';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <ProjectStackChrome projectId={projectId} />,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: APP.canvas },
        lazy: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="files" options={{ title: 'Files' }} />
      <Tabs.Screen name="ask-sunny" options={{ title: 'Ask Sunny' }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
      <Tabs.Screen name="critical-items" options={{ title: 'Critical' }} />
      <Tabs.Screen name="follow-up" options={{ title: 'Follow Up' }} />
    </Tabs>
  );
}
