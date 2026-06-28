import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEmbeddingOrNull } from '@/lib/ai/openai';
import { searchAnswer } from '@/lib/ai/sunny';
import { retrieveForQuery } from '@/lib/search/retrieve';
import {
  normalizeProjectId,
  filterResultsToProject,
  buildProjectSummary,
  chunksForAnswer,
} from '@/lib/search/scope';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      query,
      project_id,
      source_type,
      date_from,
      limit = 20,
    } = body as {
      query: string;
      project_id?: string;
      source_type?: string;
      date_from?: string;
      limit?: number;
    };

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const scopedProjectId = normalizeProjectId(project_id);

    const embedding = await createEmbeddingOrNull(query);
    const retrieved = filterResultsToProject(
      await retrieveForQuery(supabase, query, embedding, {
        projectId: scopedProjectId,
        limit,
      }),
      scopedProjectId
    );

    let results = retrieved.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      file_id: r.file_id,
      chunk_index: r.chunk_index ?? 0,
      text: r.text,
      metadata: r.metadata,
      similarity: r.similarity,
      rank: r.rank,
      match_reason: r.match_reason,
      file_name: r.file_name,
      source_type: r.source_type,
      client_name: r.client_name,
      project_name: r.project_name,
    }));

    if (source_type) {
      results = results.filter((r) => r.source_type === source_type);
    }

    if (date_from && results.some((r) => r.file_id)) {
      const fileIds = [...new Set(results.map((r) => r.file_id).filter(Boolean))];
      const { data: files } = await supabase
        .from('files')
        .select('id, created_at')
        .in('id', fileIds as string[]);
      const fileDates = new Map((files ?? []).map((f) => [f.id, f.created_at]));
      results = results.filter((r) => {
        if (!r.file_id) return true;
        const created = fileDates.get(r.file_id);
        return created && new Date(created) >= new Date(date_from);
      });
    }

    const projectIds = [...new Set(results.map((r) => r.project_id))];
    const { summary: projectSummary } = await buildProjectSummary(
      supabase,
      scopedProjectId,
      projectIds
    );

    const sunnyAnswer = await searchAnswer(query, {
      chunks: chunksForAnswer(results, scopedProjectId),
      criticalItems: [],
      timelineEvents: [],
      projectSummary,
    });

    return NextResponse.json({ results: results.slice(0, limit), sunnyAnswer });
  } catch (error) {
    console.error('Search error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
