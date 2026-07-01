import { sampleTextForAnalysis } from '@/lib/processing/text-sampling';

/** Pull query-relevant excerpts from long extracted files instead of only the first N chars. */
export function excerptFileTextForQuery(
  text: string,
  fileName: string,
  terms: string[],
  maxLen = 12_000
): string {
  if (text.length <= maxLen) return text;
  if (terms.length === 0) return sampleTextForAnalysis(text, fileName, maxLen);

  const lower = text.toLowerCase();
  const slices: string[] = [];

  for (const term of terms) {
    let index = lower.indexOf(term);
    while (index !== -1 && slices.length < 10) {
      const start = Math.max(0, index - 900);
      const end = Math.min(text.length, index + term.length + 1400);
      slices.push(text.slice(start, end).trim());
      index = lower.indexOf(term, index + term.length);
    }
  }

  if (slices.length === 0) {
    return sampleTextForAnalysis(text, fileName, maxLen);
  }

  return [...new Set(slices)].join('\n\n').slice(0, maxLen);
}
