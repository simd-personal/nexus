import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CriticalItemRow } from '@/components/lists';
import { Button, Card, EmptyState, Screen, StatPill, Subtitle } from '@/components/ui';
import { fetchProjectOverview, uploadProjectPhoto } from '@/lib/api';
import type { CriticalItem } from '@/lib/types';
import { spacing } from '@/theme/colors';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const query = useQuery({
    queryKey: ['project-overview', id],
    queryFn: () => fetchProjectOverview(id!),
    enabled: Boolean(id),
  });

  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => uploadProjectPhoto(id!, uri, `photo-${Date.now()}.jpg`, note),
    onSuccess: async () => {
      setPreviewUri(null);
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['project-overview', id] });
      Alert.alert('Uploaded', 'Sunny will process your photo shortly.');
    },
    onError: (error: Error) => Alert.alert('Upload failed', error.message),
  });

  async function pickPhoto(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera or photo access to upload project pictures.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!result.canceled && result.assets[0]?.uri) {
      setPreviewUri(result.assets[0].uri);
    }
  }

  const project = query.data?.project;
  const stats = query.data?.stats;

  return (
    <Screen>
      <Stack.Screen options={{ title: project?.project_name ?? 'Project' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />}
      >
        {project ? (
          <>
            <View style={styles.header}>
              <Text style={styles.client}>{project.client_name}</Text>
              <Subtitle>{project.last_summary ?? 'No summary yet.'}</Subtitle>
            </View>

            <View style={styles.statsRow}>
              <StatPill label="Files" value={stats?.file_count ?? 0} />
              <StatPill label="Critical" value={stats?.critical_item_count ?? 0} tone="danger" />
              <StatPill label="Actions" value={stats?.action_item_count ?? 0} />
            </View>

            <Card>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Text style={styles.sectionBody}>Capture whiteboards, notes, or site photos for this project.</Text>
              <View style={styles.photoActions}>
                <View style={styles.photoButton}>
                  <Button label="Camera" variant="secondary" onPress={() => pickPhoto(true)} />
                </View>
                <View style={styles.photoButton}>
                  <Button label="Library" variant="secondary" onPress={() => pickPhoto(false)} />
                </View>
              </View>

              {previewUri ? (
                <View style={styles.previewBlock}>
                  <Image source={{ uri: previewUri }} style={styles.previewImage} />
                  <Button
                    label="Upload to project"
                    onPress={() => uploadMutation.mutate(previewUri)}
                    loading={uploadMutation.isPending}
                  />
                  <Button label="Cancel" variant="ghost" onPress={() => setPreviewUri(null)} />
                </View>
              ) : null}
            </Card>

            <Text style={styles.sectionTitle}>Critical items</Text>
            {(query.data?.critical_items ?? []).length === 0 ? (
              <EmptyState title="No critical items" body="Sunny has not flagged issues for this project." />
            ) : (
              (query.data?.critical_items ?? []).map((item: CriticalItem) => <CriticalItemRow key={item.id} item={item} />)
            )}
          </>
        ) : query.isLoading ? (
          <Text style={styles.loading}>Loading project…</Text>
        ) : (
          <EmptyState title="Project not found" body="This project may have been deleted." />
        )}
      </ScrollView>
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
    color: '#64748B',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E1115',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photoButton: {
    flex: 1,
  },
  previewBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  loading: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: spacing.xl,
  },
});
