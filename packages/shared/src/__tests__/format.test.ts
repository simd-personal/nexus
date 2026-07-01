import { describe, expect, it } from 'vitest';
import { formatRelativeTime, formatUploadDate } from '../format';

describe('formatUploadDate', () => {
  it('formats an ISO timestamp as a readable calendar date', () => {
    expect(formatUploadDate('2026-03-15T12:00:00.000Z')).toBe('Mar 15, 2026');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-30T12:00:00.000Z');

  it('returns Just now for times under one minute', () => {
    expect(formatRelativeTime('2026-06-30T11:59:30.000Z', now)).toBe('Just now');
  });

  it('returns minutes ago', () => {
    expect(formatRelativeTime('2026-06-30T11:45:00.000Z', now)).toBe('15m ago');
  });

  it('returns hours ago', () => {
    expect(formatRelativeTime('2026-06-30T08:00:00.000Z', now)).toBe('4h ago');
  });

  it('returns days ago', () => {
    expect(formatRelativeTime('2026-06-28T12:00:00.000Z', now)).toBe('2d ago');
  });

  it('returns formatted date after seven days', () => {
    expect(formatRelativeTime('2026-06-01T12:00:00.000Z', now)).toBe('Jun 1, 2026');
  });
});
