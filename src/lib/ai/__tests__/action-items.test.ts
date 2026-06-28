import { describe, expect, it } from 'vitest';
import { normalizeActionItems } from '@/lib/ai/sunny';

describe('normalizeActionItems', () => {
  it('maps action/task fields to title', () => {
    const items = normalizeActionItems([
      { action: 'Complete ROI model before executive sync' },
      { task: 'Finalize vendor cutover plan', owner: 'Maria Santos' },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0].title).toContain('ROI model');
    expect(items[1].owner).toBe('Maria Santos');
  });

  it('accepts plain string entries', () => {
    expect(normalizeActionItems(['Send follow up email', 'Review Denver timeline'])).toEqual([
      { title: 'Send follow up email' },
      { title: 'Review Denver timeline' },
    ]);
  });

  it('drops entries with no recognizable title', () => {
    expect(normalizeActionItems([{ description: 'missing title' }, null, ''])).toEqual([]);
  });

  it('preserves title field when present', () => {
    const items = normalizeActionItems([
      {
        title: 'Confirm staffing plan for Portland and Salem',
        description: 'Raised in June site visit notes',
        owner: 'Sim Patel',
        due_date: '2025-07-15',
      },
    ]);
    expect(items[0]).toEqual({
      title: 'Confirm staffing plan for Portland and Salem',
      description: 'Raised in June site visit notes',
      owner: 'Sim Patel',
      due_date: '2025-07-15',
    });
  });
});
