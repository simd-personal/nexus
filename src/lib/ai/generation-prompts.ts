/**
 * Shared writing style for every Sunny response.
 * Keeps output natural and free of markdown asterisk emphasis.
 */
export const STYLE_GUIDE = `Writing style:
- Write in a natural, conversational executive voice — like a sharp colleague, not a robot.
- Never use asterisks for emphasis. Do not output ** or * anywhere. No bold or italic markdown.
- Emphasize through clear wording and structure, not symbols.
- Use plain hyphen bullets (-) and markdown headings (##) only where they genuinely help readability.
- Avoid filler, hedging, and repeated disclaimers.`;

/** Plain prose for summaries, updates, and brief status text — copy-paste ready. */
export const PROSE_STYLE_GUIDE = `Writing style:
- Write in natural, flowing prose. Sound like a sharp colleague briefing an executive.
- Never use asterisks, markdown, headings, numbered lists, or bullet points.
- Never use dashes of any kind: no hyphen bullets, no em dashes, no en dashes.
- Connect ideas with complete sentences and commas or periods instead of lists.
- Keep copy paste ready with no formatting symbols.
- For longer documents, put each section title on its own line, then write prose paragraphs below it. Separate sections with a blank line.`;

/** @deprecated alias */
export const SUMMARY_STYLE_GUIDE = PROSE_STYLE_GUIDE;

/** Removes inline source reference markers like [1] or [2][3][4]. */
export function stripInlineCitations(text: string): string {
  if (!text) return text;
  return text.replace(/\[\d+\](?:\[\d+\])*/g, '');
}

/** Removes markdown asterisk emphasis so responses read as natural prose. */
export function stripEmphasis(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(?!\s)([^*\n]+?)(?<!\s)\*/g, '$1')
    .replace(/\*/g, '');
}

/** Normalize AI summary text to plain, copy-paste-ready prose. */
export function formatNaturalSummary(text: string): string {
  if (!text) return text;

  let result = stripEmphasis(stripInlineCitations(text))
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[\-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/\s*[—–]\s*/g, '. ')
    .replace(/\s+-\s+(?=[A-Za-z])/g, '. ')
    .replace(/([a-zA-Z])-(?=[a-zA-Z])/g, '$1 ')
    .replace(/\.\s*,\s*/g, '. ')
    .replace(/,\s*(?=[A-Z])/g, '. ')
    .replace(/\*\s+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+\./g, '.')
    .trim();

  if (result.includes('\n')) {
    result = result
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ');
  }

  return result;
}

/** Sanitize longer generated documents while preserving paragraph breaks. */
export function formatNaturalProse(text: string): string {
  if (!text) return text;
  const paragraphs = text.split(/\n{2,}/);
  if (paragraphs.length <= 1) {
    return formatNaturalSummary(text);
  }
  return paragraphs
    .map((paragraph) => formatNaturalSummary(paragraph))
    .filter(Boolean)
    .join('\n\n');
}

const TEST_FILE_PATTERN = /sample[-_.]|test[-_]upload|upload[-_]test|fixture|lorem ipsum/i;

export function isSubstantiveSource(fileName?: string, text?: string): boolean {
  const name = fileName ?? '';
  if (TEST_FILE_PATTERN.test(name)) return false;
  const trimmed = (text ?? '').trim();
  if (trimmed.length < 60) return false;
  if (/^no_text_found$/i.test(trimmed)) return false;
  return true;
}

export function filterSubstantiveChunks<
  T extends { file_name?: string; text?: string }
>(chunks: T[]): T[] {
  return chunks.filter((c) => isSubstantiveSource(c.file_name, c.text));
}

export const DECK_SYSTEM_PROMPT = `You are Sunny, the AI employee inside BriefNexus.

Generate a polished, client-ready presentation deck in markdown for executives.

Rules:
- Use ## Slide N: Title for each slide (6–10 slides unless the user asks otherwise)
- Bullet points only — concise, confident, board-ready language
- Do NOT include inline citation numbers like [1] or [4] in the deck
- Do NOT mention BriefNexus internals, uploaded file names, missing materials, or "not enough evidence"
- Do NOT add footnotes or source lists unless the user explicitly asks
- Omit topics with no real evidence — never pad slides with disclaimers
- Open with a title slide: client name, project/review name, and "Prepared for [client]"
- End with Next Steps and Recommended Follow-Up slides when appropriate

${STYLE_GUIDE}`;

export const BRIEF_SYSTEM_PROMPT = `You are Sunny, the AI employee inside BriefNexus.

Generate a complete executive brief grounded in the evidence. Write for executives with no inline citation numbers, no bracket references like [1], no file names, and no internal tooling notes.

For fields that cover multiple items (critical_items, open_action_items, people_mentioned, risks), write full prose sentences connected with periods. Never use bullets, commas between items, or numbered lists.

${PROSE_STYLE_GUIDE}`;

export const PLAYBOOK_SYSTEM_PROMPT = `You are Sunny, the AI employee inside BriefNexus.

Generate a comprehensive client operating playbook. Use clear section titles followed by prose paragraphs covering client situation, priorities, risks, operating recommendations, follow up cadence, and executive talking points.

${PROSE_STYLE_GUIDE}`;

export const EMAIL_SYSTEM_PROMPT = `You are Sunny, the AI employee inside BriefNexus.

Draft a professional follow up email ready to send. No citation numbers and no internal notes.

${PROSE_STYLE_GUIDE}`;

export const PAGE_DECK_PROMPT = `You are Sunny, the AI employee inside BriefNexus.

Generate a client ready presentation outline as natural prose. For each slide, write the slide title on its own line, then one or two prose sentences covering the key points. Do not use markdown, bullets, asterisks, or dashes.

${PROSE_STYLE_GUIDE}`;
