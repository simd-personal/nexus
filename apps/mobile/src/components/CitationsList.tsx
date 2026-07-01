import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  citationDisplayKey,
  formatCitationDisplay,
  type CitationDisplay,
} from '@/lib/citation-display';
import type { Citation } from '@/lib/types';
import { APP, radius, spacing } from '@/theme/colors';

type CitationsListProps = {
  citations: Citation[];
  projectId?: string;
};

function dedupeCitations(citations: Citation[]): Array<{ citation: Citation; display: CitationDisplay }> {
  const seen = new Set<string>();
  const unique: Array<{ citation: Citation; display: CitationDisplay }> = [];

  for (const citation of citations) {
    const display = formatCitationDisplay(citation);
    const key = citationDisplayKey(citation, display);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ citation, display });
  }

  return unique;
}

export function CitationsList({ citations, projectId }: CitationsListProps) {
  const router = useRouter();
  const unique = dedupeCitations(citations);
  if (!unique.length) return null;

  const showProject = !projectId;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sources</Text>
      <View style={styles.list}>
        {unique.map(({ citation, display }, index) => {
          const canOpen = Boolean(projectId && citation.file_id);

          const chip = (
            <View style={styles.chip}>
              <Feather name="file-text" size={12} color={APP.textMuted} style={styles.icon} />
              <View style={styles.textCol}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {display.fileName}
                </Text>
                {showProject && display.projectLabel ? (
                  <Text style={styles.projectLabel} numberOfLines={1}>
                    {display.projectLabel}
                  </Text>
                ) : null}
              </View>
              {display.pageNumber ? (
                <View style={styles.pageBadge}>
                  <Text style={styles.pageBadgeText}>p.{display.pageNumber}</Text>
                </View>
              ) : null}
            </View>
          );

          if (canOpen) {
            return (
              <Pressable
                key={`${citation.file_id ?? display.fileName}-${index}`}
                onPress={() => router.push(`/project/${projectId}`)}
                accessibilityRole="link"
                accessibilityLabel={`Open ${display.fileName}`}
                style={({ pressed }) => [pressed && styles.chipPressed]}
              >
                {chip}
              </Pressable>
            );
          }

          return (
            <View key={`${citation.file_id ?? display.fileName}-${index}`}>{chip}</View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: APP.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: APP.border,
    backgroundColor: APP.surface,
    paddingVertical: 7,
    paddingLeft: 10,
    paddingRight: 10,
    gap: 6,
  },
  chipPressed: {
    opacity: 0.75,
  },
  icon: {
    marginTop: 1,
  },
  textCol: {
    flexShrink: 1,
    minWidth: 0,
    gap: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    color: APP.text,
  },
  projectLabel: {
    fontSize: 10,
    lineHeight: 13,
    color: APP.textMuted,
  },
  pageBadge: {
    borderRadius: radius.full,
    backgroundColor: APP.btnSecondaryBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pageBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: APP.textMuted,
  },
});
