import { describe, expect, it } from 'vitest';
import {
  checkOffTopicQuery,
  checkRetrievalRelevance,
  looksLikeOnTopicWork,
  passesRelevanceGate,
} from '@/lib/security/query-guard';
import type { RetrievedChunk } from '@/lib/search/retrieve';

function chunk(partial: Partial<RetrievedChunk> & Pick<RetrievedChunk, 'text'>): RetrievedChunk {
  return {
    id: 'chunk-1',
    project_id: 'project-1',
    metadata: {},
    match_reason: 'Semantic match',
    ...partial,
    text: partial.text,
  };
}

describe('checkOffTopicQuery', () => {
  it('blocks obvious general-chat prompts', () => {
    const verdict = checkOffTopicQuery('Write me a poem about the ocean');
    expect(verdict?.allowed).toBe(false);
    expect(verdict?.reason).toBe('off_topic');
  });

  it('allows project-oriented questions', () => {
    expect(checkOffTopicQuery('What did Maria say about the vendor deadline?')).toBeNull();
    expect(checkOffTopicQuery('Summarize the latest client meeting')).toBeNull();
  });

  it('allows create requests that look general', () => {
    expect(checkOffTopicQuery('Draft a follow-up email to the client')).toBeNull();
    expect(checkOffTopicQuery('Create an executive brief')).toBeNull();
  });
});

describe('looksLikeOnTopicWork', () => {
  it('recognizes search and project vocabulary', () => {
    expect(looksLikeOnTopicWork('Find mentions of the budget in uploaded notes')).toBe(true);
    expect(looksLikeOnTopicWork('Tell me about the Acme roadmap')).toBe(true);
  });
});

describe('passesRelevanceGate', () => {
  it('passes when project summary is substantive', () => {
    expect(passesRelevanceGate([], 'A'.repeat(100))).toBe(true);
  });

  it('passes on strong semantic similarity', () => {
    const results = [
      chunk({
        text: 'Vendor consolidation is the top priority for Q3 with a July deadline.',
        file_name: 'exec-sync.md',
        similarity: 0.72,
      }),
    ];
    expect(passesRelevanceGate(results, null)).toBe(true);
  });

  it('blocks weak fuzzy-only matches', () => {
    const results = [
      chunk({
        text: 'Short unrelated note.',
        file_name: 'scratch.txt',
        similarity: 0.12,
        match_reason: 'Related match',
        rank: 0,
      }),
    ];
    expect(passesRelevanceGate(results, null)).toBe(false);
  });

  it('passes keyword matches without high similarity', () => {
    const results = [
      chunk({
        text: 'Lisa Park owns the ROI model due before the June executive sync.',
        file_name: 'notes.md',
        match_reason: 'Keyword match',
        rank: 2,
      }),
    ];
    expect(passesRelevanceGate(results, null)).toBe(true);
  });
});

describe('checkRetrievalRelevance', () => {
  it('returns a refusal when retrieval is too weak', () => {
    const verdict = checkRetrievalRelevance([], null);
    expect(verdict?.allowed).toBe(false);
    expect(verdict?.reason).toBe('low_relevance');
  });
});
