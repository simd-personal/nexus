import { structuredExtraction } from '@/lib/ai/openai';
import { getFileExtension } from '@/lib/constants';

/**
 * Camera/device default names that carry no meaning, e.g. photo-1782951207899.jpg,
 * IMG_0042.jpeg, Screenshot 2026-07-01.png, scan001.jpg.
 */
const GENERIC_NAME_PATTERN =
  /^(photo|image|img|pic|picture|scan|scanned|screenshot|screen[-_ ]?shot|capture|upload|file|pxl|dsc[nf]?|mvimg|untitled|unnamed|new[-_ ]?doc(ument)?)[-_ ]?[\d\s()\-_.]*(at[\d\s().]*)?(am|pm)?\.[a-z0-9]+$/i;

export function hasGenericFileName(fileName: string): boolean {
  return GENERIC_NAME_PATTERN.test(fileName.trim());
}

function sanitizeSuggestedName(raw: string): string {
  return raw
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .replace(/[^\w.\-()+&#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim();
}

/**
 * Suggests a descriptive file name from extracted content (e.g. an invoice
 * number spotted in a photo). Returns null if the content is too vague or the
 * AI call fails — auto-naming must never block file processing.
 */
export async function suggestFileNameFromContent(
  text: string,
  currentFileName: string
): Promise<string | null> {
  const content = text.trim();
  if (content.length < 20) return null;

  try {
    const result = await structuredExtraction<{ name?: string | null }>(
      `You name uploaded files based on their content so they are easy to find later.
Return JSON: {"name": "<short descriptive file name>"} — no file extension.

Rules:
- 2 to 8 words, plain title case.
- Lead with the most significant identifier: invoice number, PO number, receipt number, contract or agreement name, statement period, company/vendor name, or document title.
- Examples: "Invoice 4392 - Acme Corp", "Receipt Home Depot 2026-06-14", "W9 Form - Jane Smith", "Lease Agreement 12 Main St".
- Only use characters valid in file names (letters, numbers, spaces, hyphens, parentheses).
- If the content has no meaningful identifier or is too vague to name confidently, return {"name": null}.`,
      `Current file name: ${currentFileName}\n\nExtracted content:\n${content.slice(0, 6000)}`
    );

    const suggested = typeof result.name === 'string' ? sanitizeSuggestedName(result.name) : '';
    if (!suggested || suggested.length < 3) return null;

    const ext = getFileExtension(currentFileName);
    return `${suggested}${ext}`;
  } catch (error) {
    console.warn(
      '[file-naming] Suggestion failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}
