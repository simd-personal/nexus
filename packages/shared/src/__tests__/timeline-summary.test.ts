import { describe, expect, it } from 'vitest';
import {
  compactTimelineSummary,
  timelineEventDetail,
  timelineEventIsExpandable,
  truncateTimelineText,
} from '../timeline-summary';
import type { TimelineSummaryEvent } from '../timeline-summary';

function event(
  partial: Partial<TimelineSummaryEvent> & Pick<TimelineSummaryEvent, 'event_type' | 'title'>
): TimelineSummaryEvent {
  return {
    description: null,
    ...partial,
  };
}

describe('truncateTimelineText', () => {
  it('flattens whitespace and truncates long text', () => {
    const long = 'Line one.\n\nLine two with extra detail that keeps going for a while.';
    expect(truncateTimelineText(long, 30)).toBe('Line one. Line two with extra…');
  });
});

describe('compactTimelineSummary', () => {
  it('shows only the file name for uploads', () => {
    expect(
      compactTimelineSummary(
        event({
          event_type: 'file_upload',
          title: 'Uploaded: RMC060226OwningArea (4).xlsx',
          description: 'The export is a Support Environment custom items extract created by Kim Hollman.',
        })
      )
    ).toBe('RMC060226OwningArea (4).xlsx');
  });

  it('truncates sunny summaries to a short preview', () => {
    const summary = compactTimelineSummary(
      event({
        event_type: 'sunny_summary',
        title: 'Sunny summarized: notes.txt',
        description:
          'The export is a Support Environment custom items extract created by Kim Hollman on June 2, 2026, with 1,574 records across owning areas and departments.',
      })
    );

    expect(summary.length).toBeLessThanOrEqual(120);
    expect(summary.startsWith('The export is a Support Environment')).toBe(true);
    expect(summary.endsWith('…')).toBe(true);
  });

  it('keeps action items concise with source file', () => {
    expect(
      compactTimelineSummary(
        event({
          event_type: 'action_item',
          title: '7 action item(s) extracted',
          description: 'From pasted-email-1782855751035.txt',
        })
      )
    ).toBe('7 action item(s) extracted · pasted-email-1782855751035.txt');
  });
});

describe('timelineEventDetail', () => {
  it('returns the full flattened message for expansion', () => {
    const fullDescription =
      'The meeting notes show the team is working through final Epic go live issues, with immediate coordination across sites.';
    expect(
      timelineEventDetail(
        event({
          event_type: 'sunny_summary',
          title: 'Sunny summarized: notes.txt',
          description: fullDescription,
        })
      )
    ).toBe(fullDescription);
  });
});

describe('timelineEventIsExpandable', () => {
  it('marks long summaries as expandable', () => {
    expect(
      timelineEventIsExpandable(
        event({
          event_type: 'sunny_summary',
          title: 'Sunny summarized: notes.txt',
          description:
            'The meeting notes show the team is working through final Epic go live issues, with immediate coordination across sites and follow ups planned.',
        })
      )
    ).toBe(true);
  });

  it('does not expand short upload names', () => {
    expect(
      timelineEventIsExpandable(
        event({
          event_type: 'file_upload',
          title: 'Uploaded: notes.txt',
          description: 'Short note',
        })
      )
    ).toBe(false);
  });
});
