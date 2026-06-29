import { describe, expect, it } from 'vitest';
import {
  capActionItems,
  collectWatchTerms,
  filterActionItemsForWatchlist,
  findMatchedTerms,
  ownerMatchesUser,
  parseKeywordList,
  shouldSurfaceActionItem,
  type WatchlistContext,
} from '@/lib/relevance/watchlist';

const baseContext: WatchlistContext = {
  userName: 'Sim Patel',
  userEmail: 'sim@test.com',
  userEmailLocal: 'sim',
  companyName: 'UpperDeck',
  nameAliases: ['Simpson'],
  accountKeywords: ['portfolio lead'],
  projectClientName: 'Epic Health',
  projectName: 'Epic Transition',
  projectKeywords: ['Epic', 'Conifer'],
  projectRole: 'Program lead',
};

describe('parseKeywordList', () => {
  it('splits comma and newline separated values', () => {
    expect(parseKeywordList('Epic, Conifer\nCutover')).toEqual(['Epic', 'Conifer', 'Cutover']);
  });

  it('drops single-character tokens', () => {
    expect(parseKeywordList('A, Epic')).toEqual(['Epic']);
  });
});

describe('collectWatchTerms', () => {
  it('includes profile and configured keywords but not whole project titles', () => {
    const terms = collectWatchTerms(baseContext);
    expect(terms).toContain('sim patel');
    expect(terms).toContain('sim');
    expect(terms).toContain('epic');
    expect(terms).toContain('upperdeck');
    expect(terms).not.toContain('epic transition');
    expect(terms).not.toContain('epic health');
  });
});

describe('ownerMatchesUser', () => {
  it('matches full name, alias, and email local part', () => {
    expect(ownerMatchesUser('Sim Patel', baseContext)).toBe(true);
    expect(ownerMatchesUser('Simpson', baseContext)).toBe(true);
    expect(ownerMatchesUser('sim@test.com', baseContext)).toBe(true);
    expect(ownerMatchesUser('Maria Santos', baseContext)).toBe(false);
  });
});

describe('shouldSurfaceActionItem', () => {
  it('surfaces commitments tied to watchlist terms', () => {
    expect(
      shouldSurfaceActionItem(
        {
          title: 'Sim to send Epic cutover timeline',
          item_kind: 'commitment',
          applies_to_me: true,
          matched_terms: ['Sim', 'Epic'],
          confidence: 'high',
        },
        baseContext
      )
    ).toBe(true);
  });

  it('drops informational items even when terms match', () => {
    expect(
      shouldSurfaceActionItem(
        {
          title: 'Epic go-live was discussed as background context',
          item_kind: 'informational',
          matched_terms: ['Epic'],
          confidence: 'high',
        },
        baseContext
      )
    ).toBe(false);
  });

  it('drops unrelated tasks for other owners', () => {
    expect(
      shouldSurfaceActionItem(
        {
          title: 'Maria to finalize vendor contract',
          owner: 'Maria Santos',
          item_kind: 'commitment',
          confidence: 'high',
        },
        baseContext
      )
    ).toBe(false);
  });

  it('surfaces items assigned to the account holder', () => {
    expect(
      shouldSurfaceActionItem(
        {
          title: 'Send staffing update to client',
          owner: 'Sim Patel',
          item_kind: 'commitment',
          confidence: 'medium',
        },
        baseContext
      )
    ).toBe(true);
  });

  it('does not surface risk items owned by someone else', () => {
    expect(
      shouldSurfaceActionItem(
        {
          title: 'Escalate clearinghouse readiness to Orlando Health',
          owner: 'Operational Director',
          item_kind: 'risk',
          matched_terms: ['Ellie'],
          confidence: 'high',
        },
        baseContext
      )
    ).toBe(false);
  });
});

describe('filterActionItemsForWatchlist', () => {
  it('keeps only relevant items', () => {
    const filtered = filterActionItemsForWatchlist(
      [
        { title: 'Sim to review Epic timeline', item_kind: 'commitment', matched_terms: ['Sim', 'Epic'] },
        { title: 'Lisa to book travel', owner: 'Lisa Park', item_kind: 'commitment' },
      ],
      baseContext
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain('Sim');
  });
});

describe('findMatchedTerms', () => {
  it('finds case-insensitive substring matches', () => {
    expect(findMatchedTerms('Sim will own the EPIC cutover', ['sim', 'epic'])).toEqual(['sim', 'epic']);
  });
});

describe('capActionItems', () => {
  it('limits transcript items more aggressively', () => {
    const items = Array.from({ length: 10 }, (_, index) => ({ title: `Item ${index}` }));
    expect(capActionItems(items, 'transcript')).toHaveLength(5);
    expect(capActionItems(items, 'document')).toHaveLength(8);
  });
});
