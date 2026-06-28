export interface SpreadsheetSheet {
  name: string;
  rows: string[][];
}

export interface SpreadsheetParseStats {
  total_rows: number;
  indexed_rows: number;
  truncated: boolean;
  sheets: number;
}

/** Per-sheet row cap keeps messy workbooks indexable within server time limits. */
export const MAX_ROWS_PER_SHEET = 1200;

export function isSpreadsheetFile(fileName: string, mimeType?: string): boolean {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return true;
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  );
}

function trimSparseRow(row: unknown[]): string[] {
  const cells = row.map((cell) => String(cell ?? '').trim());
  let start = 0;
  let end = cells.length;
  while (start < end && !cells[start]) start++;
  while (end > start && !cells[end - 1]) end--;
  return cells.slice(start, end);
}

function rowHasContent(row: string[]): boolean {
  const nonEmpty = row.filter(Boolean);
  if (nonEmpty.length === 0) return false;
  if (nonEmpty.length === 1 && nonEmpty[0].length < 2) return false;
  return true;
}

/** Drop blank rows, repeated lines, and ultra-wide sparse rows common in messy exports. */
export function normalizeSpreadsheetRows(rows: string[][]): string[][] {
  const normalized: string[][] = [];
  let lastSignature: string | null = null;

  for (const row of rows) {
    const trimmed = trimSparseRow(row);
    if (!rowHasContent(trimmed)) continue;

    const filledRatio = trimmed.filter(Boolean).length / Math.max(trimmed.length, 1);
    if (trimmed.length > 12 && filledRatio < 0.15) continue;

    const signature = formatSpreadsheetRow(trimmed);
    if (signature === lastSignature) continue;
    lastSignature = signature;

    normalized.push(trimmed);
  }

  return normalized;
}

export function formatSpreadsheetRow(row: string[]): string {
  return row.filter(Boolean).join(' | ');
}

export function formatSpreadsheetSheet(name: string, rows: string[][]): string {
  const lines = rows.map(formatSpreadsheetRow).filter(Boolean);
  if (lines.length === 0) return '';
  return `Sheet: ${name}\n${lines.join('\n')}`;
}

export async function parseSpreadsheetBuffer(
  buffer: Buffer
): Promise<{ text: string; sheets: SpreadsheetSheet[]; stats: SpreadsheetParseStats }> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheets: SpreadsheetSheet[] = [];
  const textParts: string[] = [];
  let totalRows = 0;
  let indexedRows = 0;
  let truncated = false;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    const normalized = normalizeSpreadsheetRows(
      rawRows.map(trimSparseRow).filter((row) => row.some((cell) => cell.length > 0))
    );

    if (normalized.length === 0) continue;

    totalRows += normalized.length;
    const capped = normalized.length > MAX_ROWS_PER_SHEET;
    const rows = capped ? normalized.slice(0, MAX_ROWS_PER_SHEET) : normalized;
    if (capped) truncated = true;
    indexedRows += rows.length;

    sheets.push({ name: sheetName, rows });
    const formatted = formatSpreadsheetSheet(sheetName, rows);
    if (formatted) textParts.push(formatted);
  }

  return {
    text: textParts.join('\n\n'),
    sheets,
    stats: {
      total_rows: totalRows,
      indexed_rows: indexedRows,
      truncated,
      sheets: sheets.length,
    },
  };
}

export async function extractSpreadsheetText(buffer: Buffer): Promise<string> {
  const { text } = await parseSpreadsheetBuffer(buffer);
  return text;
}

export function sampleSpreadsheetText(text: string, maxLen = 12000): string {
  if (text.length <= maxLen) return text;

  const sections: string[] = [text.slice(0, 4000)];
  const sheets = text.split(/\n\n(?=Sheet: )/);
  const keywords =
    /\b(action|owner|phase|priority|timeline|target|due|denial|category|status|risk|approved)\b/i;

  for (const sheet of sheets) {
    if (!keywords.test(sheet)) continue;
    if (sections.join('\n\n').length >= maxLen) break;
    sections.push(sheet.slice(0, 3500));
  }

  if (text.length > maxLen) {
    const mid = Math.floor(text.length / 2);
    sections.push(text.slice(mid, mid + 3000));
    sections.push(text.slice(-3500));
  }

  return sections.join('\n\n').slice(0, maxLen);
}
