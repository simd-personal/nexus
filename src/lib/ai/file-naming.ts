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

export type SuggestedFileName = {
  fileName: string;
  /** Document type when the content makes it obvious, e.g. "Invoice". */
  documentType: string | null;
};

/**
 * Suggests a descriptive file name from extracted content (e.g. an invoice
 * number spotted in a photo). Classifies the document type first (invoice,
 * receipt, quote, …) and leads the name with it when obvious. Returns null
 * only when the content is too sparse to say anything, or the AI call fails —
 * auto-naming must never block file processing.
 */
export async function suggestFileNameFromContent(
  text: string,
  currentFileName: string
): Promise<SuggestedFileName | null> {
  const content = text.trim();
  if (content.length < 20) return null;

  try {
    const result = await structuredExtraction<{ type?: string | null; name?: string | null }>(
      `You name uploaded files (often photos of documents) based on their extracted text so they are easy to find later.
Return JSON: {"type": "<document type or null>", "name": "<short descriptive file name>"} — no file extension.

Step 1 — classify. Decide what the document most likely is from its text: Invoice, Receipt, Quote, Estimate, Purchase Order, Packing Slip, Statement, Contract, Agreement, Business Card, Check, Tax Form, Permit, Label, Menu, Whiteboard Notes, Sign, Letter, etc. Set "type" to that word or phrase. If the type is genuinely unclear, set "type" to null.

Step 2 — name. Build the best-sense name:
- If the type is clear, lead with it, then the vendor/company/party, then the strongest identifier (number, date, period). Examples: "Invoice - County Industrial Supply 4392", "Receipt - Home Depot 2026-06-14", "Quote - Advanced Hydraulic Supply", "Business Card - Jane Smith".
- If the type is unclear but the text is substantial, write a short descriptive title of what the content is about instead. Example: "Q3 Delivery Schedule Notes".
- 2 to 8 words, plain title case, only characters valid in file names (letters, numbers, spaces, hyphens, parentheses).
- Prefer a reasonable best guess over giving up. Return {"type": null, "name": null} only when the text is too sparse, garbled, or meaningless to describe at all.`,
      `Current file name: ${currentFileName}\n\nExtracted content:\n${content.slice(0, 6000)}`
    );

    const suggested = typeof result.name === 'string' ? sanitizeSuggestedName(result.name) : '';
    if (!suggested || suggested.length < 3) return null;

    const documentType =
      typeof result.type === 'string' && result.type.trim() ? result.type.trim().slice(0, 40) : null;

    const ext = getFileExtension(currentFileName);
    return { fileName: `${suggested}${ext}`, documentType };
  } catch (error) {
    console.warn(
      '[file-naming] Suggestion failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return null;
  }
}
