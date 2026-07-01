import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProjectSectionNav } from '@/components/project/ProjectSectionNav';
import { fetchProjectOverview } from '@/lib/api';
import { BRAND, spacing } from '@/theme/colors';

type ProjectStackChromeProps = {
  projectId: string;
};

const SIDE_SLOT_WIDTH = 44;

export function ProjectStackChrome({ projectId }: ProjectStackChromeProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const overviewQuery = useQuery({
    queryKey: ['project-overview', projectId],
    queryFn: () => fetchProjectOverview(projectId),
    enabled: Boolean(projectId),
  });

  const title = overviewQuery.data?.project?.project_name ?? 'Project';
  const client = overviewQuery.data?.project?.client_name;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.sideSlot, pressed && styles.sideSlotPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={24}
            color={BRAND.graphite}
            style={Platform.OS === 'ios' ? styles.chevron : undefined}
          />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {client ? (
            <Text style={styles.client} numberOfLines={1}>
              {client}
            </Text>
          ) : null}
        </View>

        <View style={styles.sideSlot} />
      </View>
      <ProjectSectionNav projectId={projectId} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: BRAND.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E1',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: spacing.xs,
  },
  sideSlot: {
    width: SIDE_SLOT_WIDTH,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideSlotPressed: {
    opacity: 0.55,
  },
  chevron: {
    marginLeft: -2,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND.graphite,
    textAlign: 'center',
  },
  client: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND.textMuted,
    textAlign: 'center',
  },
});
