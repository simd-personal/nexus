export type TextDiffStats = {
  lines_added: number;
  lines_removed: number;
  lines_unchanged: number;
};

export type TextDiffResult = {
  additions: string[];
  removals: string[];
  stats: TextDiffStats;
  preview: string;
};

const MAX_DIFF_LINES = 80;
const MAX_LINE_LENGTH = 240;

function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ');
}

function lineKey(line: string): string {
  return normalizeLine(line).toLowerCase();
}

function truncateLine(line: string): string {
  const trimmed = normalizeLine(line);
  if (trimmed.length <= MAX_LINE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_LINE_LENGTH)}…`;
}

function meaningfulLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);
}

export function computeTextDiff(oldText: string, newText: string): TextDiffResult {
  const oldLines = meaningfulLines(oldText);
  const newLines = meaningfulLines(newText);

  const oldKeys = new Set(oldLines.map(lineKey));
  const newKeys = new Set(newLines.map(lineKey));

  const removals = oldLines.filter((line) => !newKeys.has(lineKey(line))).map(truncateLine);
  const additions = newLines.filter((line) => !oldKeys.has(lineKey(line))).map(truncateLine);

  const unchanged = newLines.filter((line) => oldKeys.has(lineKey(line))).length;

  const previewParts: string[] = [];
  for (const line of removals.slice(0, MAX_DIFF_LINES)) {
    previewParts.push(`- ${line}`);
  }
  for (const line of additions.slice(0, MAX_DIFF_LINES)) {
    previewParts.push(`+ ${line}`);
  }

  if (removals.length + additions.length > MAX_DIFF_LINES) {
    previewParts.push('… diff truncated …');
  }

  return {
    additions,
    removals,
    stats: {
      lines_added: additions.length,
      lines_removed: removals.length,
      lines_unchanged: unchanged,
    },
    preview: previewParts.join('\n'),
  };
}

export function buildDiffStatsLabel(stats: TextDiffStats): string {
  const parts: string[] = [];
  if (stats.lines_added > 0) parts.push(`${stats.lines_added} added`);
  if (stats.lines_removed > 0) parts.push(`${stats.lines_removed} removed`);
  if (stats.lines_unchanged > 0) parts.push(`${stats.lines_unchanged} unchanged`);
  return parts.join(' · ') || 'No line changes detected';
}
