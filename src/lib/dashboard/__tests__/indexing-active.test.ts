import { describe, expect, it } from 'vitest';
import { isDashboardIndexingActive } from '@/lib/dashboard/indexing-active';

describe('isDashboardIndexingActive', () => {
  it('is true when batches are pending', () => {
    expect(isDashboardIndexingActive([{ batchId: 'b1' }], false)).toBe(true);
  });

  it('is true when files are still processing', () => {
    expect(isDashboardIndexingActive([], true)).toBe(true);
  });

  it('is false when nothing is indexing', () => {
    expect(isDashboardIndexingActive([], false)).toBe(false);
  });
});
