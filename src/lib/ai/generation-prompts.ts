/**
 * Shared writing style for every Sunny response.
 * Keeps output natural and free of markdown asterisk emphasis.
 */
export const STYLE_GUIDE = `Writing style:
- Write in a natural, conversational executive voice, like a sharp colleague, not a robot.
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
- Never include file names, page numbers, or a Sources line. Source documents are attached separately.
- For longer documents, put each section title on its own line, then write prose paragraphs below it. Separate sections with a blank line.`;

/** @deprecated alias */
export const SUMMARY_STYLE_GUIDE = PROSE_STYLE_GUIDE;

/** Removes inline source reference markers like [1] or [2][3][4]. */
export function stripInlineCitations(text: string): string {
  if (!text) return text;
  return text.replace(/\[\d+\](?:\[\d+\])*/g, '');
}

/** Removes inline "Sources: file.pdf ..." blocks echoed into prose fields. */
export function stripEmbeddedSourceReferences(text: string): string {
  if (!text) return text;

  let result = text;
  const sourceWithContinuation =
    /\bSources?\s*:[\s\S]*?\.\s+(?=(?:I|We|You|The|This|That|Until|It|They|There|These|Those|First|Second|Third|Next|Also|However|Review|Make|Confirm|Ask|Request|Treat|Say|Ensure|Before|After|Once|When|If|While|Although|Because|Since|Unless|For|In|At|On|As|An|A)\b)/i;

  for (let attempt = 0; attempt < 10 && /\bSources?\s*:/i.test(result); attempt += 1) {
    const trimmed = result.replace(sourceWithContinuation, '');
    if (trimmed !== result) {
      result = trimmed;
      continue;
    }
    result = result.replace(/\bSources?\s*:[\s\S]*$/i, '');
    break;
  }

  result = result.replace(
    /\.\s*(?:[^.]+\.(?:pdf|docx?|xlsx?|txt|md|eml|png|jpe?g|webp|csv)(?:\s*,\s*[^.]*)*\.?\s*)+(?:pages?\s+\d+(?:\s+(?:to|through)\s+\d+)?\.?\s*)*/gi,
    '.'
  );

  return result.replace(/\.\s*\./g, '.').replace(/\s+\./g, '.').trim();
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

  let result = stripEmbeddedSourceReferences(stripEmphasis(stripInlineCitations(text)))
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

export const DECK_SYSTEM_PROMPT = `You are Sunny, the AI employee inside UpperDeck.

Generate a polished, board-ready presentation deck in markdown for C-suite and VP audiences. It must feel like a McKinsey/BCG-style executive deck: crisp headlines, visual hierarchy, metrics where evidence supports them, and clear story flow.

Document structure:
- Open with # Client · Review Name and ### Prepared for [Client]
- Use ## Slide N: Title for each slide (8 to 12 slides unless the user asks otherwise)
- Separate slides with ---

Each slide MUST start with a layout line, then content using that layout's format:

Layout: hero. Opening or chapter opener (use on slide 1 and optionally one section opener)
Highlight: One punchy headline stat or takeaway (max 12 words)
- 2 to 4 supporting bullets

Layout: metrics. KPI snapshot (use when numbers exist in evidence)
Metric: VALUE | LABEL | optional context
(3 to 4 metrics per slide; VALUE can be %, $, count, or date)

Layout: cards. Priorities, workstreams, or initiatives
Priority: TITLE | one-line description | Owner: NAME
(3 to 4 cards per slide)

Layout: quote. Executive voice or client concern
Quote: The exact sentiment in quotes
Attribution: Name, Role

Layout: section. Dark divider between story chapters (no bullets)
Section: Short chapter title (3 to 6 words)

Layout: two-column. Comparison or parallel tracks
Left:
- bullet
Right:
- bullet

Layout: bullets. Default content slide
- Short, confident bullet points (max 6)

Story arc (adapt to evidence):
1. hero: Executive Summary
2. metrics: Performance Snapshot (only if real numbers exist; otherwise cards)
3. bullets or cards: Key Discussion Points
4. bullets: Decisions Made
5. section: Risks & Ownership (divider)
6. cards or bullets: Risks and Open Items
7. cards: Ownership & Accountability
8. bullets: Next Steps
9. hero or bullets: Recommended Follow Up

Rules:
- Lead every slide with the insight, not background. Headlines should stand alone.
- Use real numbers from evidence; never invent metrics
- Bullet points only on bullets/two-column layouts, not on metrics/cards/quote/section slides
- Do NOT include inline citation numbers like [1]
- Do NOT mention UpperDeck, uploaded files, missing materials, or "not enough evidence"
- Do NOT use asterisk emphasis (** or *)
- Do NOT use em dashes, en dashes, or hyphenated compound words in titles or body copy
- Omit topics with no evidence. Never pad with disclaimers.

${STYLE_GUIDE}`;

export const BRIEF_SYSTEM_PROMPT = `You are Sunny, the AI employee inside UpperDeck.

Generate a complete executive brief grounded in the evidence. Write for executives with no inline citation numbers, no bracket references like [1], no file names, and no internal tooling notes.

For fields that cover multiple items (critical_items, open_action_items, people_mentioned, risks), write full prose sentences connected with periods. Never use bullets, commas between items, or numbered lists.

${PROSE_STYLE_GUIDE}`;

export const PLAYBOOK_SYSTEM_PROMPT = `You are Sunny, the AI employee inside UpperDeck.

Generate a comprehensive client operating playbook. Use clear section titles followed by prose paragraphs covering client situation, priorities, risks, operating recommendations, follow up cadence, and executive talking points.

${PROSE_STYLE_GUIDE}`;

export const EMAIL_SYSTEM_PROMPT = `You are Sunny, the AI employee inside UpperDeck.

Draft a professional follow up email ready to send. No citation numbers and no internal notes.

${PROSE_STYLE_GUIDE}`;

export const PAGE_DECK_PROMPT = `You are Sunny, the AI employee inside UpperDeck.

Generate a client ready presentation outline as natural prose. For each slide, write the slide title on its own line, then one or two prose sentences covering the key points. Do not use markdown, bullets, asterisks, or dashes.

${PROSE_STYLE_GUIDE}`;
