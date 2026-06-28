import { sampleSpreadsheetText, isSpreadsheetFile } from '@/lib/processing/spreadsheet';

const KEYWORD_RE =
  /\b(action|owner|phase|priority|timeline|target|due|denial|category|status|risk|decision|approved|deadline|follow-up|follow up)\b/i;

function sampleLongDocument(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;

  const sections: string[] = [];
  const introSize = Math.min(5000, Math.floor(maxLen * 0.35));
  sections.push(text.slice(0, introSize));

  const pageSections = text.split(/\n(?=Page \d+|\[Page \d+\])/i);
  if (pageSections.length > 1) {
    for (const section of pageSections) {
      if (!KEYWORD_RE.test(section)) continue;
      if (sections.join('\n\n').length >= maxLen) break;
      sections.push(section.slice(0, 3500));
    }
  } else {
    const paragraphs = text.split(/\n{2,}/);
    for (const paragraph of paragraphs) {
      if (!KEYWORD_RE.test(paragraph)) continue;
      if (sections.join('\n\n').length >= maxLen) break;
      if (paragraph.length > 80) sections.push(paragraph.slice(0, 2500));
    }
  }

  const tailSize = Math.min(4000, Math.floor(maxLen * 0.25));
  sections.push(text.slice(-tailSize));

  const mid = Math.floor(text.length / 2);
  sections.push(text.slice(mid, mid + Math.min(3500, Math.floor(maxLen * 0.2))));

  return sections.join('\n\n').slice(0, maxLen);
}

export function sampleTextForAnalysis(text: string, fileName: string, maxLen = 12000): string {
  if (text.length <= maxLen) return text;
  if (isSpreadsheetFile(fileName)) return sampleSpreadsheetText(text, maxLen);
  return sampleLongDocument(text, maxLen);
}
