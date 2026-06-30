import { Stack } from 'expo-router';
import { themedStackScreenOptions } from '@/navigation/stackHeaderOptions';

export default function ProjectLayout() {
  return (
    <Stack screenOptions={themedStackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Project' }} />
      <Stack.Screen name="files" options={{ title: 'Files' }} />
    </Stack>
  );
}
