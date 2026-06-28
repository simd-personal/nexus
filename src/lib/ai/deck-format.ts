/**
 * Validates Claude/GPT-style markdown deck output:
 * - ## Slide N: Title headings
 * - Bullet slides, no inline [1] citations, no internal tooling notes
 */

export interface DeckSlide {
  number: number;
  title: string;
  body: string;
}

export interface DeckFormatIssue {
  code: string;
  message: string;
}

export interface DeckFormatResult {
  valid: boolean;
  slideCount: number;
  slides: DeckSlide[];
  issues: DeckFormatIssue[];
}

const SLIDE_HEADING_RE = /^##\s+Slide\s+(\d+):\s+(.+)$/gim;
const INLINE_CITATION_RE = /\[\d+\]/;
const INTERNAL_NOTE_RE =
  /not enough evidence|briefnexus|uploaded files?|sample[-_]slide|pdf upload test/i;

export interface DeckViewSlide {
  number: number;
  title: string;
  bullets: string[];
}

export interface DeckView {
  title: string | null;
  subtitle: string | null;
  slides: DeckViewSlide[];
}

/** Parses deck markdown into structured slides for visual rendering in chat. */
export function parseDeckForViewer(content: string): DeckView {
  const slides: DeckViewSlide[] = parseDeckSlides(content).map((slide) => ({
    number: slide.number,
    title: slide.title,
    bullets: slide.body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && line !== '---' && !line.startsWith('#'))
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean),
  }));

  const beforeFirstSlide = content.split(/^##\s+Slide/im)[0] ?? '';
  const titleMatch = beforeFirstSlide.match(/^#\s+(.+)$/m);
  const subtitleMatch = beforeFirstSlide.match(/^###\s+(.+)$/m);

  return {
    title: titleMatch?.[1]?.trim() ?? null,
    subtitle: subtitleMatch?.[1]?.trim() ?? null,
    slides,
  };
}

export function parseDeckSlides(content: string): DeckSlide[] {
  const slides: DeckSlide[] = [];
  const matches = [...content.matchAll(SLIDE_HEADING_RE)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? content.length) : content.length;
    slides.push({
      number: Number(match[1]),
      title: match[2].trim(),
      body: content.slice(start, end).trim(),
    });
  }

  return slides;
}

export function validateDeckFormat(content: string): DeckFormatResult {
  const issues: DeckFormatIssue[] = [];
  const trimmed = content.trim();

  if (!trimmed) {
    return { valid: false, slideCount: 0, slides: [], issues: [{ code: 'empty', message: 'Deck is empty' }] };
  }

  const slides = parseDeckSlides(trimmed);

  if (slides.length < 3) {
    issues.push({
      code: 'min_slides',
      message: `Expected at least 3 slides (## Slide N: Title), found ${slides.length}`,
    });
  }

  for (const slide of slides) {
    if (!slide.body.includes('-')) {
      issues.push({
        code: 'missing_bullets',
        message: `Slide ${slide.number} should use bullet points`,
      });
    }
  }

  if (INLINE_CITATION_RE.test(trimmed)) {
    issues.push({
      code: 'inline_citations',
      message: 'Deck should not include inline citation numbers like [1] or [4]',
    });
  }

  if (trimmed.includes('*')) {
    issues.push({
      code: 'asterisks',
      message: 'Deck should read naturally without asterisk emphasis (** or *)',
    });
  }

  if (INTERNAL_NOTE_RE.test(trimmed)) {
    issues.push({
      code: 'internal_notes',
      message: 'Deck should not mention missing evidence, BriefNexus, or test uploads',
    });
  }

  const numbers = slides.map((s) => s.number);
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    issues.push({ code: 'duplicate_slide_numbers', message: 'Slide numbers must be unique' });
  }

  return {
    valid: issues.length === 0,
    slideCount: slides.length,
    slides,
    issues,
  };
}

/** Sample deck matching the expected GPT/Claude executive markdown format */
export const SAMPLE_VALID_DECK = `# Acme Corp — Q3 Business Review
### Prepared for Acme Corp

---

## Slide 1: Executive Summary
- Q3 revenue is up 12 percent
- Board is aligned on west region expansion
- Vendor consolidation identified as the top priority
- Denver and Phoenix markets approved for expansion

---

## Slide 2: Key Discussion Points
- CEO James Wright confirmed board alignment on west region expansion
- Vendor consolidation is the leading operational initiative
- ROI model required to support expansion decisions
- Exec sync scheduled for June 28

---

## Slide 3: Decisions Made
- Approved Denver and Phoenix market expansion
- Aligned board support for west region expansion
- Prioritized vendor consolidation as the top operational focus

---

## Slide 4: Ownership and Accountability
- Maria Santos in Ops owns the vendor cutover plan, due July 15
- Lisa Park, CFO, requires the ROI model before the exec sync
- Sim Patel is following up with finance on the ROI model

---

## Slide 5: Risks and Open Items
- ROI model not yet complete, needed before the June 28 exec sync
- Vendor cutover execution depends on Maria Santos delivering the plan by July 15

---

## Slide 6: Next Steps
- Deliver the ROI model ahead of the June 28 exec sync
- Complete the vendor cutover plan by July 15
- Proceed with Denver and Phoenix expansion planning

---

## Slide 7: Recommended Follow-Up
- Confirm ROI model status before the exec sync
- Track the vendor cutover plan milestone on July 15
- Validate expansion timelines for Denver and Phoenix
`;
