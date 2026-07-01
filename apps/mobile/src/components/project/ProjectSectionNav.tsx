import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  PROJECT_SECTIONS,
  activeProjectSection,
  projectSectionPath,
  type ProjectSection,
} from '@/lib/project-sections';
import { BRAND, radius, spacing } from '@/theme/colors';

type ProjectSectionNavProps = {
  projectId: string;
};

export function ProjectSectionNav({ projectId }: ProjectSectionNavProps) {
  const router = useRouter();
  const segments = useSegments();
  const scrollRef = useRef<ScrollView>(null);
  const activeKey = activeProjectSection(segments as string[]);

  function navigate(section: ProjectSection) {
    router.push(projectSectionPath(projectId, section) as `/project/${string}`);
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {PROJECT_SECTIONS.map((section) => {
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
                color={active ? BRAND.accent : BRAND.textMuted}
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
    backgroundColor: BRAND.cream,
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
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  pillPressed: {
    opacity: 0.88,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.textMuted,
  },
  pillLabelActive: {
    color: BRAND.accent,
  },
});
