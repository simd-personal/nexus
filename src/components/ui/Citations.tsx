import Link from 'next/link';
import type { Citation, SearchResult } from '@/types/database';

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

function citationHref(citation: Citation, projectId?: string): string | null {
  if (citation.file_id && projectId) {
    return `/projects/${projectId}/files?file=${citation.file_id}`;
  }
  if (projectId) {
    return `/projects/${projectId}/files`;
  }
  return null;
}

function citationLabel(citation: Citation): string {
  const parts = [citation.file_name?.trim() || 'Unknown source'];
  if (citation.page_number) parts.push(`p.${citation.page_number}`);
  return parts.join(', ');
}

export function searchResultsToCitations(results: SearchResult[]): Citation[] {
  return results.map((result) => ({
    file_id: result.file_id,
    file_name: result.file_name ?? 'Unknown file',
    source_type: result.source_type,
    snippet: '',
  }));
}

export function CitationsList({ citations, projectId }: CitationsListProps) {
  const unique = dedupeCitations(citations);
  if (!unique.length) return null;

  return (
    <p className="mt-2 text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
      <span>Sources: </span>
      {unique.map((citation, index) => {
        const href = citationHref(citation, projectId);
        const label = citationLabel(citation);

        return (
          <span key={`${citation.file_id ?? citation.file_name}-${index}`}>
            {index > 0 && <span className="text-gray-300 dark:text-gray-600"> · </span>}
            {href ? (
              <Link href={href} className="text-gray-500 hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200">
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
          </span>
        );
      })}
    </p>
  );
}
