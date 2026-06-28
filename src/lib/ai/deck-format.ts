/**
 * Validates and parses executive markdown deck output for DeckViewer.
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

export type DeckSlideLayout =
  | 'hero'
  | 'metrics'
  | 'cards'
  | 'quote'
  | 'section'
  | 'two-column'
  | 'bullets';

export interface DeckMetric {
  value: string;
  label: string;
  note?: string;
}

export interface DeckCard {
  title: string;
  body: string;
  owner?: string;
}

export interface DeckViewSlide {
  number: number;
  title: string;
  layout: DeckSlideLayout;
  bullets: string[];
  highlight?: string;
  metrics?: DeckMetric[];
  cards?: DeckCard[];
  quote?: { text: string; attribution?: string };
  sectionLabel?: string;
  columns?: { left: string[]; right: string[] };
}

export interface DeckView {
  title: string | null;
  subtitle: string | null;
  slides: DeckViewSlide[];
}

const SLIDE_HEADING_RE = /^##\s+Slide\s+(\d+):\s+(.+)$/gim;
const INLINE_CITATION_RE = /\[\d+\]/;
const INTERNAL_NOTE_RE =
  /not enough evidence|upperdeck|uploaded files?|sample[-_]slide|pdf upload test/i;

const LAYOUT_ALIASES: Record<string, DeckSlideLayout> = {
  hero: 'hero',
  title: 'hero',
  metrics: 'metrics',
  stats: 'metrics',
  kpi: 'metrics',
  cards: 'cards',
  priorities: 'cards',
  quote: 'quote',
  section: 'section',
  divider: 'section',
  'two-column': 'two-column',
  twocolumn: 'two-column',
  columns: 'two-column',
  bullets: 'bullets',
  default: 'bullets',
};

function normalizeLayout(raw: string): DeckSlideLayout {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '-');
  return LAYOUT_ALIASES[key] ?? 'bullets';
}

function parseBullets(lines: string[]): string[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line && line !== '---' && !line.startsWith('#'))
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

export function parseSlideContent(body: string, slideNumber = 1): Omit<DeckViewSlide, 'number' | 'title'> {
  const lines = body.split('\n');
  let layout: DeckSlideLayout = slideNumber === 1 ? 'hero' : 'bullets';
  let highlight: string | undefined;
  let quoteText: string | undefined;
  let attribution: string | undefined;
  let sectionLabel: string | undefined;
  const metrics: DeckMetric[] = [];
  const cards: DeckCard[] = [];
  const contentLines: string[] = [];
  let column: 'left' | 'right' | null = null;
  const left: string[] = [];
  const right: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line === '---') continue;

    const layoutMatch = line.match(/^Layout:\s*(.+)$/i);
    if (layoutMatch) {
      layout = normalizeLayout(layoutMatch[1]);
      continue;
    }

    const highlightMatch = line.match(/^Highlight:\s*(.+)$/i);
    if (highlightMatch) {
      highlight = highlightMatch[1].trim();
      continue;
    }

    const metricMatch = line.match(/^Metric:\s*(.+)$/i);
    if (metricMatch) {
      const parts = metricMatch[1].split('|').map((p) => p.trim());
      if (parts.length >= 2) {
        metrics.push({ value: parts[0], label: parts[1], note: parts[2] });
      }
      continue;
    }

    const priorityMatch = line.match(/^Priority:\s*(.+)$/i);
    if (priorityMatch) {
      const parts = priorityMatch[1].split('|').map((p) => p.trim());
      const ownerPart = parts.find((p) => /^owner:/i.test(p));
      cards.push({
        title: parts[0] ?? 'Priority',
        body: parts[1] ?? '',
        owner: ownerPart?.replace(/^owner:\s*/i, ''),
      });
      continue;
    }

    const quoteMatch = line.match(/^Quote:\s*(.+)$/i);
    if (quoteMatch) {
      quoteText = quoteMatch[1].trim().replace(/^["']|["']$/g, '');
      continue;
    }

    const attrMatch = line.match(/^Attribution:\s*(.+)$/i);
    if (attrMatch) {
      attribution = attrMatch[1].trim();
      continue;
    }

    const sectionMatch = line.match(/^Section:\s*(.+)$/i);
    if (sectionMatch) {
      sectionLabel = sectionMatch[1].trim();
      layout = 'section';
      continue;
    }

    if (/^Left:\s*$/i.test(line)) {
      column = 'left';
      continue;
    }
    if (/^Right:\s*$/i.test(line)) {
      column = 'right';
      continue;
    }

    if (column === 'left') {
      left.push(...parseBullets([line]));
      continue;
    }
    if (column === 'right') {
      right.push(...parseBullets([line]));
      continue;
    }

    contentLines.push(line);
  }

  const bullets = parseBullets(contentLines);

  if (metrics.length > 0 && layout === 'bullets') layout = 'metrics';
  if (cards.length > 0 && layout === 'bullets') layout = 'cards';
  if (quoteText && layout === 'bullets') layout = 'quote';
  if (sectionLabel && layout === 'bullets') layout = 'section';
  if ((left.length > 0 || right.length > 0) && layout === 'bullets') layout = 'two-column';

  return {
    layout,
    bullets,
    highlight,
    metrics: metrics.length ? metrics : undefined,
    cards: cards.length ? cards : undefined,
    quote: quoteText ? { text: quoteText, attribution } : undefined,
    sectionLabel,
    columns: left.length || right.length ? { left, right } : undefined,
  };
}

/** Parses deck markdown into structured slides for visual rendering in chat. */
export function parseDeckForViewer(content: string): DeckView {
  const parsedSlides = parseDeckSlides(content);
  const slides: DeckViewSlide[] = parsedSlides.map((slide) => ({
    number: slide.number,
    title: slide.title,
    ...parseSlideContent(slide.body, slide.number),
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

function slideHasContent(slide: DeckSlide): boolean {
  const parsed = parseSlideContent(slide.body, slide.number);
  return (
    parsed.bullets.length > 0 ||
    Boolean(parsed.highlight) ||
    Boolean(parsed.metrics?.length) ||
    Boolean(parsed.cards?.length) ||
    Boolean(parsed.quote) ||
    Boolean(parsed.sectionLabel) ||
    Boolean(parsed.columns?.left.length || parsed.columns?.right.length)
  );
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
    if (!slideHasContent(slide)) {
      issues.push({
        code: 'empty_slide',
        message: `Slide ${slide.number} has no content`,
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
      message: 'Deck should not mention missing evidence, UpperDeck, or test uploads',
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

/** Sample deck matching the expected executive markdown format */
export const SAMPLE_VALID_DECK = `# Acme Corp · Q3 Business Review
### Prepared for Acme Corp

---

## Slide 1: Executive Summary
Layout: hero
Highlight: Q3 revenue up 12% with board alignment on west expansion
- Denver and Phoenix markets approved for expansion
- Vendor consolidation is the top operational priority
- Exec sync scheduled for June 28

---

## Slide 2: Performance Snapshot
Layout: metrics
Metric: 12% | Revenue Growth | vs prior quarter
Metric: 2 | Markets Approved | Denver and Phoenix
Metric: June 28 | Next Exec Sync | ROI model review
Metric: July 15 | Vendor Cutover | Target completion

---

## Slide 3: Strategic Priorities
Layout: cards
Priority: Vendor Consolidation | Reduce duplicate vendors and simplify procurement | Owner: Maria Santos
Priority: West Region Expansion | Scale approved Denver and Phoenix operations | Owner: Ops Leadership
Priority: ROI Clarity | Deliver finance model before exec sync | Owner: Lisa Park

---

## Slide 4: Key Discussion Points
Layout: bullets
- CEO James Wright confirmed board alignment on west region expansion
- Vendor consolidation is the leading operational initiative
- ROI model required to support expansion decisions

---

## Slide 5: Risks & Ownership
Layout: section
Section: Risks & Mitigation

---

## Slide 6: Risks and Open Items
Layout: bullets
- ROI model not yet complete, needed before the June 28 exec sync
- Vendor cutover execution depends on Maria Santos delivering the plan by July 15

---

## Slide 7: Recommended Follow-Up
Layout: hero
Highlight: Confirm ROI and vendor milestones before June 28
- Validate expansion timelines for Denver and Phoenix
- Track vendor cutover plan milestone on July 15
`;
