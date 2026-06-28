import { describe, expect, it } from 'vitest';
import {
  buildScopeInstruction,
  chunksForAnswer,
  filterResultsToProject,
  normalizeProjectId,
} from '@/lib/search/scope';
import type { RetrievedChunk } from '@/lib/search/retrieve';

const sampleChunks: RetrievedChunk[] = [
  {
    id: '1',
    project_id: 'proj-a',
    file_id: 'f1',
    chunk_index: 0,
    file_name: 'notes.md',
    text: 'Denver expansion approved.',
    metadata: { file_name: 'notes.md' },
    similarity: 0.9,
    rank: 1,
    match_reason: 'vector',
  },
  {
    id: '2',
    project_id: 'proj-b',
    file_id: 'f2',
    chunk_index: 0,
    text: 'Unrelated client update.',
    metadata: { file_name: 'other.txt' },
    similarity: 0.8,
    rank: 2,
    match_reason: 'vector',
  },
];

describe('search scope helpers', () => {
  it('normalizes empty project ids to null', () => {
    expect(normalizeProjectId(undefined)).toBeNull();
    expect(normalizeProjectId('  ')).toBeNull();
    expect(normalizeProjectId('abc-123')).toBe('abc-123');
  });

  it('filters retrieval results to one project', () => {
    const filtered = filterResultsToProject(sampleChunks, 'proj-a');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].project_id).toBe('proj-a');
  });

  it('returns all results when no project scope', () => {
    expect(filterResultsToProject(sampleChunks, null)).toHaveLength(2);
  });

  it('builds scoped search instructions', () => {
    expect(buildScopeInstruction('proj-a', 'Acme — Q3 Review')).toContain('ONLY the project');
    expect(buildScopeInstruction(null, null)).toContain('ALL projects');
    expect(buildScopeInstruction('proj-a', null)).toBeNull();
  });

  it('labels chunks with project names in global search', () => {
    const labeled = chunksForAnswer(sampleChunks, null);
    expect(labeled[0].file_name).toContain('notes.md');
  });

  it('limits chunks passed to the answer model', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      ...sampleChunks[0],
      id: String(i),
      chunk_index: i,
    }));
    expect(chunksForAnswer(many, 'proj-a')).toHaveLength(22);
  });
});
