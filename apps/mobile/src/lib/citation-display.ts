import type { Citation } from '@/lib/types';

export type CitationDisplay = {
  fileName: string;
  projectLabel?: string;
  pageNumber?: number;
};

const FILE_EXTENSION = /\.\w{2,5}$/i;

/** Strip search context prefixes like `[Client · Project] …` down to a readable file label. */
export function formatCitationDisplay(citation: Citation): CitationDisplay {
  let raw = citation.file_name?.trim() || 'Unknown source';
  let projectLabel: string | undefined;

  const bracketMatch = raw.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (bracketMatch) {
    projectLabel = shortenProjectLabel(bracketMatch[1]);
    raw = bracketMatch[2].trim();
  }

  if (projectLabel && raw.startsWith(projectLabel)) {
    raw = raw.slice(projectLabel.length).replace(/^[ ·]+/, '').trim();
  }

  const segments = raw
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean);

  let fileName = raw;
  const withExtension = segments.filter((part) => FILE_EXTENSION.test(part));
  if (withExtension.length > 0) {
    fileName = withExtension[withExtension.length - 1];
  } else if (segments.length > 1) {
    fileName = segments[segments.length - 1];
  }

  fileName = fileName.replace(/^["']|["']$/g, '').trim() || 'Unknown source';

  return {
    fileName,
    projectLabel,
    pageNumber: citation.page_number,
  };
}

function shortenProjectLabel(label: string): string {
  const first = label.split(' · ')[0]?.trim();
  if (!first || first.length >= label.length) return label;
  return first;
}

export function citationDisplayKey(citation: Citation, display: CitationDisplay): string {
  const project = display.projectLabel?.toLowerCase() ?? '';
  return citation.file_id ?? `${project}:${display.fileName.toLowerCase()}`;
}
