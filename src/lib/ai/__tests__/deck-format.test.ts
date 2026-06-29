import { describe, expect, it } from 'vitest';
import {
  SAMPLE_VALID_DECK,
  parseDeckForViewer,
  parseDeckSlides,
  validateDeckFormat,
} from '@/lib/ai/deck-format';
import {
  filterSubstantiveChunks,
  formatNaturalSummary,
  isSubstantiveSource,
  stripEmphasis,
} from '@/lib/ai/generation-prompts';

describe('deck format validation', () => {
  it('accepts a GPT/Claude-style markdown deck with slide headings and bullets', () => {
    const result = validateDeckFormat(SAMPLE_VALID_DECK);
    expect(result.valid).toBe(true);
    expect(result.slideCount).toBe(7);
    expect(result.issues).toHaveLength(0);
  });

  it('parses slide numbers and titles', () => {
    const slides = parseDeckSlides(SAMPLE_VALID_DECK);
    expect(slides[0]).toMatchObject({ number: 1, title: 'Executive Summary' });
    expect(slides[6]).toMatchObject({ number: 7, title: 'Recommended Follow-Up' });
    expect(slides[0].body).toContain('Q3 revenue');
  });

  it('handles missing content without throwing (cached deck artifacts lose content)', () => {
    // localStorage trims artifact.content, so a restored deck can arrive as undefined.
    expect(parseDeckSlides(undefined as unknown as string)).toEqual([]);
    expect(parseDeckSlides('')).toEqual([]);
    expect(parseDeckForViewer(undefined as unknown as string)).toEqual({
      title: null,
      subtitle: null,
      slides: [],
    });
    expect(validateDeckFormat(undefined as unknown as string).valid).toBe(false);
  });

  it('rejects decks with inline citation numbers', () => {
    const bad = SAMPLE_VALID_DECK.replace(
      'Q3 revenue up 12% with board alignment on west expansion',
      'Q3 revenue up 12% with board alignment on west expansion [5]'
    );
    const result = validateDeckFormat(bad);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'inline_citations')).toBe(true);
  });

  it('rejects decks that use asterisk emphasis', () => {
    const bad = SAMPLE_VALID_DECK.replace(
      'Q3 revenue up 12% with board alignment on west expansion',
      'Q3 revenue up **12%** with board alignment on west expansion'
    );
    const result = validateDeckFormat(bad);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'asterisks')).toBe(true);
  });

  it('rejects decks with internal tooling disclaimers', () => {
    const bad = `${SAMPLE_VALID_DECK}\n\n*Not enough evidence in the uploaded materials.*`;
    const result = validateDeckFormat(bad);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'internal_notes')).toBe(true);
  });

  it('rejects decks with too few slides', () => {
    const result = validateDeckFormat('## Slide 1: Only One\n- bullet');
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === 'min_slides')).toBe(true);
  });

  it('rejects empty output', () => {
    const result = validateDeckFormat('   ');
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe('empty');
  });
});

describe('parseDeckForViewer (visual rendering)', () => {
  it('extracts the deck title and subtitle', () => {
    const view = parseDeckForViewer(SAMPLE_VALID_DECK);
    expect(view.title).toBe('Acme Corp · Q3 Business Review');
    expect(view.subtitle).toBe('Prepared for Acme Corp');
  });

  it('returns each slide with layout metadata and clean content', () => {
    const view = parseDeckForViewer(SAMPLE_VALID_DECK);
    expect(view.slides).toHaveLength(7);

    const first = view.slides[0];
    expect(first.number).toBe(1);
    expect(first.title).toBe('Executive Summary');
    expect(first.layout).toBe('hero');
    expect(first.highlight).toContain('Q3 revenue up 12%');
    expect(first.bullets.length).toBeGreaterThanOrEqual(3);
    expect(first.bullets[0]).toBe('Denver and Phoenix markets approved for expansion');
    expect(first.bullets.every((b) => !b.startsWith('-') && !b.includes('*'))).toBe(true);

    const metrics = view.slides[1];
    expect(metrics.layout).toBe('metrics');
    expect(metrics.metrics?.length).toBe(4);
    expect(metrics.metrics?.[0].value).toBe('12%');
  });

  it('handles content with no title heading gracefully', () => {
    const view = parseDeckForViewer('## Slide 1: Intro\n- Point A\n- Point B');
    expect(view.title).toBeNull();
    expect(view.slides[0].bullets).toEqual(['Point A', 'Point B']);
  });
});

describe('substantive source filtering for deck generation', () => {
  it('filters sample/test uploads from context', () => {
    const chunks = [
      { file_name: 'Q3-review-transcript.txt', text: 'Board approved Denver expansion and vendor consolidation timeline.' },
      { file_name: 'sample-slide.png', text: 'NO_TEXT_FOUND' },
      { file_name: 'sample-document.pdf', text: 'Short' },
    ];
    const filtered = filterSubstantiveChunks(chunks);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].file_name).toBe('Q3-review-transcript.txt');
  });

  it('keeps real meeting materials', () => {
    expect(
      isSubstantiveSource(
        'exec-sync-notes.md',
        'Maria Santos owns vendor cutover due July 15. Lisa Park needs ROI model before June 28 exec sync.'
      )
    ).toBe(true);
  });
});

describe('natural language sanitizer', () => {
  it('removes bold markdown emphasis', () => {
    expect(stripEmphasis('Revenue is up **12 percent** this quarter')).toBe(
      'Revenue is up 12 percent this quarter'
    );
  });

  it('removes italic markdown emphasis', () => {
    expect(stripEmphasis('This is *important* context')).toBe('This is important context');
  });

  it('strips stray asterisks entirely', () => {
    expect(stripEmphasis('Top priority: *vendor** consolidation')).not.toContain('*');
  });

  it('leaves clean prose untouched', () => {
    const clean = 'Board aligned on west region expansion and approved Denver.';
    expect(stripEmphasis(clean)).toBe(clean);
  });

  it('formats summaries as plain copy-paste prose', () => {
    const raw = `## Key findings\n- **Revenue** is up 12 percent\n- Client wants follow-up on Denver`;
    expect(formatNaturalSummary(raw)).toBe(
      'Key findings Revenue is up 12 percent Client wants follow up on Denver'
    );
  });

  it('removes em dashes and bullet dashes from summaries', () => {
    expect(formatNaturalSummary('Timeline slipped — client expects update')).toBe(
      'Timeline slipped. client expects update'
    );
  });

  it('removes asterisks from summaries', () => {
    expect(formatNaturalSummary('Priority: **vendor consolidation** this quarter')).not.toContain('*');
  });
});
