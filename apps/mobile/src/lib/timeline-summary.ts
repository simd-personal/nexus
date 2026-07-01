import type { TimelineEvent } from '@/lib/types';

const MAX_SUMMARY_LENGTH = 120;

function flattenText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[\-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateTimelineText(text: string, max = MAX_SUMMARY_LENGTH): string {
  const flat = flattenText(text);
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

export function compactTimelineSummary(event: TimelineEvent): string {
  const { event_type, title, description } = event;

  if (event_type === 'file_upload') {
    if (/^Uploaded \d+ files?$/i.test(title)) return title;
    const fileName = title.replace(/^Uploaded:\s*/i, '').trim();
    return truncateTimelineText(fileName || title);
  }

  if (event_type === 'sunny_summary') {
    if (description) return truncateTimelineText(description);
    return truncateTimelineText(title.replace(/^Sunny summarized:\s*/i, ''));
  }

  if (event_type === 'action_item') {
    const from = description?.replace(/^From\s+/i, '').trim();
    if (from) return truncateTimelineText(`${title} · ${from}`);
    return truncateTimelineText(title);
  }

  if (description) return truncateTimelineText(description);
  return truncateTimelineText(title);
}

export function timelineEventDetail(event: TimelineEvent): string {
  const { event_type, title, description } = event;

  if (event_type === 'file_upload') {
    if (/^Uploaded \d+ files?$/i.test(title)) return flattenText(title);
    const fileName = title.replace(/^Uploaded:\s*/i, '').trim();
    return flattenText(fileName || title);
  }

  if (event_type === 'sunny_summary') {
    if (description) return flattenText(description);
    return flattenText(title.replace(/^Sunny summarized:\s*/i, ''));
  }

  if (event_type === 'action_item') {
    const from = description?.replace(/^From\s+/i, '').trim();
    if (from) return flattenText(`${title} · ${from}`);
    return flattenText(title);
  }

  if (description) return flattenText(description);
  return flattenText(title);
}

export function timelineEventIsExpandable(event: TimelineEvent): boolean {
  const compact = compactTimelineSummary(event);
  const full = timelineEventDetail(event);
  return full.length > compact.length || compact.endsWith('…');
}
