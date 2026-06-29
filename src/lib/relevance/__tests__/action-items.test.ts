import { describe, expect, it } from 'vitest';
import {
  filterRelevantOpenActionItems,
  isNoiseActionTitle,
  isRelevantOpenActionItem,
} from '@/lib/relevance/action-items';

describe('isNoiseActionTitle', () => {
  it('flags marketing and personal inbox noise', () => {
    expect(isNoiseActionTitle('Review My Gun Torch V2 limited stock offer')).toBe(true);
    expect(isNoiseActionTitle('File RentCast receipt for travel expense')).toBe(true);
  });
});

describe('isRelevantOpenActionItem', () => {
  it('includes typed commitments assigned to the user', () => {
    expect(
      isRelevantOpenActionItem({
        title: 'Sim to send Epic cutover timeline',
        owner: 'Sim Demo',
        item_kind: 'commitment',
        applies_to_me: true,
        matched_terms: ['Sim'],
        status: 'open',
      })
    ).toBe(true);
  });

  it('excludes legacy null item_kind rows', () => {
    expect(
      isRelevantOpenActionItem({
        title: 'Complete Epic go-live client summary',
        owner: null,
        item_kind: null,
        applies_to_me: true,
        matched_terms: [],
        status: 'open',
      })
    ).toBe(false);
  });

  it('excludes other peoples work even when applies_to_me was set incorrectly', () => {
    expect(
      isRelevantOpenActionItem({
        title: 'Operational Director to escalate Playground environment provisioning',
        owner: 'Operational Director',
        item_kind: 'risk',
        applies_to_me: false,
        matched_terms: ['Ellie'],
        status: 'open',
      })
    ).toBe(false);
  });
});

describe('filterRelevantOpenActionItems', () => {
  it('returns only relevant open items', () => {
    const filtered = filterRelevantOpenActionItems([
      {
        title: 'Sim to review staffing matrix',
        owner: 'Sim Demo',
        item_kind: 'commitment',
        applies_to_me: true,
        matched_terms: ['Sim'],
        status: 'open',
      },
      {
        title: 'Review My Gun Torch V2 limited stock offer',
        owner: null,
        item_kind: null,
        applies_to_me: true,
        matched_terms: [],
        status: 'open',
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain('staffing matrix');
  });
});
