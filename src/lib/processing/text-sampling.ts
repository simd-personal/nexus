import { sampleSpreadsheetText, isSpreadsheetFile } from '@/lib/processing/spreadsheet';

export function sampleTextForAnalysis(text: string, fileName: string, maxLen = 12000): string {
  if (text.length <= maxLen) return text;
  if (isSpreadsheetFile(fileName)) return sampleSpreadsheetText(text, maxLen);
  return text.slice(0, maxLen);
}
