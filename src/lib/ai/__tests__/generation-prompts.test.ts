import { describe, expect, it } from 'vitest';
import {
  filterSubstantiveChunks,
  formatNaturalProse,
  formatNaturalSummary,
  isSubstantiveSource,
  PROSE_STYLE_GUIDE,
  stripEmphasis,
  stripEmbeddedSourceReferences,
  stripInlineCitations,
  SUMMARY_STYLE_GUIDE,
} from '@/lib/ai/generation-prompts';

describe('prose style guide', () => {
  it('defines prose style without asterisks or dash bullets', () => {
    expect(PROSE_STYLE_GUIDE).toContain('Never use asterisks');
    expect(PROSE_STYLE_GUIDE).toContain('Never use dashes');
    expect(SUMMARY_STYLE_GUIDE).toBe(PROSE_STYLE_GUIDE);
  });
});

describe('formatNaturalProse', () => {
  it('preserves paragraph breaks in longer prose', () => {
    const raw = 'Section one here.\n\nSection two here.';
    expect(formatNaturalProse(raw)).toBe('Section one here.\n\nSection two here.');
  });

  it('strips asterisks and em dashes from multi paragraph text', () => {
    const raw = '**Denver** approved — timeline set.\n\nNext step is budget follow up.';
    const result = formatNaturalProse(raw);
    expect(result).not.toContain('*');
    expect(result).not.toContain('—');
    expect(result).toContain('Denver approved');
  });

  it('removes inline citation brackets and fixes comma splices', () => {
    const raw =
      'ROI model due June 28 [4].,Vendor cutover owned by Maria Santos, due July 15 [4][6].,Vendor consolidation is top priority [5].';
    const result = formatNaturalSummary(raw);
    expect(result).not.toContain('[');
    expect(result).not.toContain(']');
    expect(result).not.toContain('.,');
    expect(result).toContain('ROI model due June 28');
    expect(result).toContain('Vendor cutover owned by Maria Santos');
  });
});

describe('formatNaturalSummary', () => {
  it('converts markdown bullets to plain prose', () => {
    expect(formatNaturalSummary('- First point\n- Second point')).toBe('First point Second point');
  });

  it('removes numbered lists', () => {
    expect(formatNaturalSummary('1. Alpha\n2. Beta')).toBe('Alpha Beta');
  });

  it('flattens multiline summaries into one paragraph', () => {
    expect(formatNaturalSummary('Line one.\n\nLine two.')).toBe('Line one. Line two.');
  });

  it('handles empty input', () => {
    expect(formatNaturalSummary('')).toBe('');
  });

  it('preserves readable sentences without markdown symbols', () => {
    const clean = 'Denver expansion approved. Sarah owns the budget follow up.';
    expect(formatNaturalSummary(clean)).toBe(clean);
  });
});

describe('stripEmbeddedSourceReferences', () => {
  it('removes inline Sources blocks before narrative continues', () => {
    const raw =
      'Defense posture is active. Sources: Re Jaiden Gilbert.pdf, pages 1 to 4. Jaidon Gilbert doc.pdf. I would also request readable versions before evaluating settlement posture.';
    expect(stripEmbeddedSourceReferences(raw)).toBe(
      'Defense posture is active. I would also request readable versions before evaluating settlement posture.'
    );
  });

  it('removes trailing Sources blocks', () => {
    const raw =
      'Make sure counsel has the parent statement. Sources: Jaidon Gilbert.Dhillon Statement.docx. Jaiden Gilbert formal letter.pdf.';
    expect(stripEmbeddedSourceReferences(raw)).toBe('Make sure counsel has the parent statement.');
  });

  it('leaves clean prose unchanged', () => {
    const clean = 'The uploaded materials support a strong accountability narrative.';
    expect(stripEmbeddedSourceReferences(clean)).toBe(clean);
  });
});

describe('stripInlineCitations', () => {
  it('removes single and chained citation markers', () => {
    expect(stripInlineCitations('Aligned on expansion [4][5][6].')).toBe('Aligned on expansion .');
  });
});

describe('stripEmphasis', () => {
  it('removes nested emphasis markers', () => {
    expect(stripEmphasis('***urgent***')).toBe('urgent');
  });
});

describe('substantive source filter', () => {
  it('rejects test fixtures and tiny snippets', () => {
    expect(isSubstantiveSource('sample-upload.txt', 'hello')).toBe(false);
    expect(isSubstantiveSource('notes.md', 'x'.repeat(50))).toBe(false);
  });

  it('accepts real meeting notes', () => {
    const text = 'Board aligned on west region expansion and approved Denver facility timeline.';
    expect(isSubstantiveSource('Q3-exec-sync.md', text)).toBe(true);
  });

  it('filters chunks consistently', () => {
    const chunks = filterSubstantiveChunks([
      { file_name: 'sample-test.txt', text: 'lorem ipsum ' + 'x'.repeat(80) },
      { file_name: 'meeting.md', text: 'Client confirmed vendor consolidation is the top priority this quarter.' },
    ]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].file_name).toBe('meeting.md');
  });
});
