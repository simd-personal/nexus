import { formatCitationDisplay } from '@/lib/citation-display';

describe('formatCitationDisplay', () => {
  it('extracts the file name from scoped search labels', () => {
    const display = formatCitationDisplay({
      file_name:
        '[Orlando EPIC Go Live · Orlando Go Live Support] Orlando EPIC Go Live · Leadership Onsite June 2026.pdf',
      snippet: '',
    });

    expect(display.fileName).toBe('Leadership Onsite June 2026.pdf');
    expect(display.projectLabel).toBe('Orlando EPIC Go Live');
  });

  it('keeps simple file names unchanged', () => {
    const display = formatCitationDisplay({
      file_name: 'EPIC_Team_Touchbase_Framework.docx',
      snippet: '',
      page_number: 2,
    });

    expect(display.fileName).toBe('EPIC_Team_Touchbase_Framework.docx');
    expect(display.projectLabel).toBeUndefined();
    expect(display.pageNumber).toBe(2);
  });
});
