import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectRow } from '@/components/lists';
import { RefreshableScroll } from '@/components/RefreshableScroll';
import { TabScreenHeader } from '@/components/BrandHeader';
import { HeaderActions, HeaderIconButton } from '@/components/ScreenHeader';
import { EmptyState, Screen } from '@/components/ui';
import { fetchProjects } from '@/lib/api';
import { BRAND, radius, spacing } from '@/theme/colors';

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
          <TabScreenHeader
            title="Projects"
            subtitle="Create projects, upload files, and capture photos for Sunny."
            rightAction={
              <HeaderActions>
                <HeaderIconButton
                  label="New project"
                  icon="add"
                  onPress={() => router.push('/project/new')}
                />
              </HeaderActions>
            }
          />
        }
        contentContainerStyle={styles.list}
      >
        <Pressable
          style={({ pressed }) => [styles.createCard, pressed && styles.createCardPressed]}
          onPress={() => router.push('/project/new')}
        >
          <View style={styles.createIcon}>
            <Ionicons name="add" size={24} color={BRAND.accent} />
          </View>
          <View style={styles.createText}>
            <Text style={styles.createTitle}>New project</Text>
            <Text style={styles.createBody}>Set up a project, then add photos and files.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={BRAND.textMuted} />
        </Pressable>

        {projects.length === 0 && !query.isLoading ? (
          <EmptyState
            title="No projects yet"
            body="Tap New project above to create your first one on mobile."
          />
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
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: spacing.xs,
  },
  createCardPressed: {
    opacity: 0.9,
  },
  createIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  createText: {
    flex: 1,
    gap: 2,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.graphite,
  },
  createBody: {
    fontSize: 13,
    lineHeight: 18,
    color: BRAND.textMuted,
  },
});
