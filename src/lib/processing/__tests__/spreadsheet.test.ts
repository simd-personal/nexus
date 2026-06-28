import { describe, expect, it } from 'vitest';
import { isSpreadsheetFile, parseSpreadsheetBuffer } from '@/lib/processing/spreadsheet';

describe('spreadsheet helpers', () => {
  it('detects spreadsheet files by extension and mime type', () => {
    expect(isSpreadsheetFile('plan.xlsx')).toBe(true);
    expect(isSpreadsheetFile('plan.xls')).toBe(true);
    expect(isSpreadsheetFile('notes.txt')).toBe(false);
    expect(
      isSpreadsheetFile(
        'plan.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    ).toBe(true);
  });

  it('parses workbook sheets into rows', async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Owner', 'Action'],
      ['Revenue Cycle', 'Review denials queue'],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Actions');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const parsed = await parseSpreadsheetBuffer(buffer);
    expect(parsed.text).toContain('Review denials queue');
    expect(parsed.sheets).toHaveLength(1);
    expect(parsed.sheets[0].name).toBe('Actions');
    expect(parsed.sheets[0].rows[1]).toEqual(['Revenue Cycle', 'Review denials queue']);
  });
});
