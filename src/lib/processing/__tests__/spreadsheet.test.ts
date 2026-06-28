import { describe, expect, it } from 'vitest';
import { chunkBySheets } from '@/lib/processing/chunk';
import { isSpreadsheetFile, normalizeSpreadsheetRows, parseSpreadsheetBuffer } from '@/lib/processing/spreadsheet';

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
    expect(parsed.text).toContain('Owner | Action');
    expect(parsed.text).not.toMatch(/,{3,}/);
    expect(parsed.stats.indexed_rows).toBeGreaterThan(0);
  });

  it('drops duplicate and mostly-empty rows from messy sheets', () => {
    const rows = normalizeSpreadsheetRows([
      ['Owner', 'Action', '', '', ''],
      ['Maria', 'Review queue', '', '', ''],
      ['Maria', 'Review queue', '', '', ''],
      ['', '', '', '', ''],
      ['x', '', '', '', '', '', '', '', '', '', '', '', ''],
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(['Maria', 'Review queue']);
  });

  it('chunks spreadsheets by row batches for stable search sections', () => {
    const rows = Array.from({ length: 80 }, (_, i) => [`Task ${i}`, `Owner ${i % 5}`]);
    const chunks = chunkBySheets([{ name: 'Plan', rows }], { file_name: 'plan.xlsx' }, 25);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text).toContain('Sheet: Plan');
    expect(chunks[0].metadata.row_start).toBe(1);
  });
});
