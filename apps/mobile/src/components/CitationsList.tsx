import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Citation } from '@/lib/types';
import { spacing } from '@/theme/colors';

type CitationsListProps = {
  citations: Citation[];
  projectId?: string;
};

function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const unique: Citation[] = [];

  for (const citation of citations) {
    const fileName = citation.file_name?.trim();
    const key = citation.file_id ?? fileName?.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(citation);
  }

  return unique;
}

function citationLabel(citation: Citation): string {
  const name = citation.file_name?.trim() || 'Unknown source';
  return citation.page_number ? `${name}, p.${citation.page_number}` : name;
}

export function CitationsList({ citations, projectId }: CitationsListProps) {
  const router = useRouter();
  const unique = dedupeCitations(citations);
  if (!unique.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sources</Text>
      <View style={styles.list}>
        {unique.map((citation, index) => {
          const label = citationLabel(citation);
          const canOpen = Boolean(projectId && citation.file_id);

          return (
            <View key={`${citation.file_id ?? citation.file_name}-${index}`} style={styles.chip}>
              {canOpen ? (
                <Pressable
                  onPress={() => router.push(`/project/${projectId}`)}
                  accessibilityRole="link"
                  style={styles.chipPressable}
                >
                  <Text style={styles.chipText} numberOfLines={2}>
                    {label}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.chipText} numberOfLines={2}>
                  {label}
                </Text>
              )}
            </View>
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
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    maxWidth: '100%',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipPressable: {
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#4B5563',
  },
});
