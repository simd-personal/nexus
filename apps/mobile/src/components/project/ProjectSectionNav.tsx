import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

/** Gently twinkling sparkle for the Ask Sunny tab — mirrors the web `.sunny-sparkle`. */
function TwinkleSparkle({
  name,
  size,
  color,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  size: number;
  color: string;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '12deg'] });

  return (
    <Animated.View style={{ opacity, transform: [{ scale }, { rotate }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

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
              {section.key === 'ask-sunny' ? (
                <TwinkleSparkle name={section.icon} size={15} color={BRAND.accent} />
              ) : (
                <Ionicons
                  name={section.icon}
                  size={15}
                  color={active ? BRAND.accent : BRAND.textMuted}
                />
              )}
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
