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
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((cell) => cell.length > 0));

    if (rows.length === 0) continue;

    sheets.push({ name: sheetName, rows });
    textParts.push(`Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet).trim()}`);
  }

  return { text: textParts.join('\n\n'), sheets };
}

export async function extractSpreadsheetText(buffer: Buffer): Promise<string> {
  const { text } = await parseSpreadsheetBuffer(buffer);
  return text;
}
