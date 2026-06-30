import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Citation } from '@/lib/types';

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
      <Text style={styles.prefix}>Sources: </Text>
      {unique.map((citation, index) => {
        const label = citationLabel(citation);
        const canOpen = Boolean(projectId && citation.file_id);

        return (
          <View key={`${citation.file_id ?? citation.file_name}-${index}`} style={styles.inline}>
            {index > 0 ? <Text style={styles.dot}> · </Text> : null}
            {canOpen ? (
              <Pressable
                onPress={() => router.push(`/project/${projectId}`)}
                accessibilityRole="link"
              >
                <Text style={styles.link}>{label}</Text>
              </Pressable>
            ) : (
              <Text style={styles.label}>{label}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  prefix: {
    fontSize: 10,
    lineHeight: 16,
    color: '#9CA3AF',
  },
  inline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dot: {
    fontSize: 10,
    lineHeight: 16,
    color: '#D1D5DB',
  },
  label: {
    fontSize: 10,
    lineHeight: 16,
    color: '#6B7280',
  },
  link: {
    fontSize: 10,
    lineHeight: 16,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
