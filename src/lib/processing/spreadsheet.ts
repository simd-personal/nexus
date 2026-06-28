export interface SpreadsheetSheet {
  name: string;
  rows: string[][];
}

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

export function formatSpreadsheetRow(row: string[]): string {
  return row.filter(Boolean).join(' | ');
}

export function formatSpreadsheetSheet(name: string, rows: string[][]): string {
  const lines = rows
    .map(trimSparseRow)
    .filter((row) => row.some((cell) => cell.length > 0))
    .map(formatSpreadsheetRow);

  if (lines.length === 0) return '';
  return `Sheet: ${name}\n${lines.join('\n')}`;
}

export async function parseSpreadsheetBuffer(
  buffer: Buffer
): Promise<{ text: string; sheets: SpreadsheetSheet[] }> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets: SpreadsheetSheet[] = [];
  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    const rows = rawRows
      .map(trimSparseRow)
      .filter((row) => row.some((cell) => cell.length > 0));

    if (rows.length === 0) continue;

    sheets.push({ name: sheetName, rows });
    const formatted = formatSpreadsheetSheet(sheetName, rows);
    if (formatted) textParts.push(formatted);
  }

  return { text: textParts.join('\n\n'), sheets };
}

export async function extractSpreadsheetText(buffer: Buffer): Promise<string> {
  const { text } = await parseSpreadsheetBuffer(buffer);
  return text;
}

export function sampleSpreadsheetText(text: string, maxLen = 12000): string {
  if (text.length <= maxLen) return text;

  const sections: string[] = [text.slice(0, 4000)];
  const sheets = text.split(/\n\n(?=Sheet: )/);
  const keywords = /\b(action|owner|phase|priority|timeline|target|due|denial|category|status)\b/i;

  for (const sheet of sheets) {
    if (!keywords.test(sheet)) continue;
    if (sections.join('\n\n').length >= maxLen) break;
    sections.push(sheet.slice(0, 3500));
  }

  if (text.length > 12000) {
    const mid = Math.floor(text.length / 2);
    sections.push(text.slice(mid, mid + 3000));
  }

  return sections.join('\n\n').slice(0, maxLen);
}
