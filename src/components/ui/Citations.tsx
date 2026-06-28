import type { Citation } from '@/types/database';
import { SOURCE_TYPE_LABELS } from '@/lib/constants';
import type { SourceType } from '@/types/database';

export function CitationsList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sources</p>
      {citations.map((citation, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
          <span className="font-mono text-gray-400 shrink-0">[{i + 1}]</span>
          <div>
            <span className="font-medium text-gray-700">{citation.file_name}</span>
            {citation.source_type && (
              <span className="text-gray-400 ml-1">
                ({SOURCE_TYPE_LABELS[citation.source_type as SourceType] ?? citation.source_type})
              </span>
            )}
            {citation.page_number && <span className="text-gray-400 ml-1">p.{citation.page_number}</span>}
            {citation.sender && <span className="text-gray-400 ml-1">from {citation.sender}</span>}
            {citation.date && <span className="text-gray-400 ml-1">{citation.date}</span>}
            <p className="text-gray-500 mt-0.5 line-clamp-2">{citation.snippet}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
