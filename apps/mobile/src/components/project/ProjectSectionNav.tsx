import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  PROJECT_SECTIONS,
  activeProjectSection,
  resolveProjectSectionNavigation,
  type ProjectSection,
} from '@/lib/project-sections';
import type { ProjectNavVisibility } from '@upperdeck/shared/project-nav';
import { filterProjectSections } from '@upperdeck/shared/project-nav';
import { APP, BRAND, radius, spacing } from '@/theme/colors';

type ProjectSectionNavProps = {
  projectId: string;
  visibility?: ProjectNavVisibility;
};

export function ProjectSectionNav({ projectId, visibility }: ProjectSectionNavProps) {
  const router = useRouter();
  const segments = useSegments();
  const scrollRef = useRef<ScrollView>(null);
  const activeKey = activeProjectSection(segments as string[]);
  const sections = filterProjectSections(
    PROJECT_SECTIONS,
    visibility ?? { showTimeline: false, showCriticalItems: false }
  );

  function navigate(section: ProjectSection) {
    const next = resolveProjectSectionNavigation(projectId, section.key, activeKey);
    if (next.kind === 'navigate') {
      router.navigate(next.path as `/project/${string}`);
    }
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {sections.map((section) => {
          const active = section.key === activeKey;
          return (
            <Pressable
              key={section.key}
              onPress={() => navigate(section)}
              style={({ pressed }) => [
                styles.pill,
                active && styles.pillActive,
                pressed && styles.pillPressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={section.label}
            >
              <Ionicons
                name={section.icon}
                size={15}
                color={
                  active || section.key === 'ask-sunny' ? BRAND.accent : BRAND.textMuted
                }
              />
              <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
                {section.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: APP.canvas,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: APP.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
  },
  pillActive: {
    backgroundColor: APP.btnSecondaryBg,
    borderColor: APP.borderStrong,
  },
  pillPressed: {
    opacity: 0.88,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: APP.textMuted,
  },
  pillLabelActive: {
    color: APP.text,
  },
});
