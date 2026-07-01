import { createClient } from '@/lib/supabase/server';
import { sampleTextForAnalysis } from '@/lib/processing/text-sampling';
import type { PageGenerationContext } from '@/lib/ai/page-generation';

export async function getProjectContext(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { data: project },
    { data: criticalItems },
    { data: timelineEvents },
    { data: recentChunks },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('critical_items').select('title, summary, severity').eq('project_id', projectId).eq('status', 'open'),
    supabase.from('timeline_events').select('title, description, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(15),
    supabase.from('chunks').select('text, file_id, metadata').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
  ]);

  const fileIds = [...new Set((recentChunks ?? []).map((c) => c.file_id))];
  const { data: files } = await supabase.from('files').select('id, file_name, source_type').in('id', fileIds);
  const fileMap = new Map((files ?? []).map((f) => [f.id, f]));

  const context: PageGenerationContext = {
    chunks: (recentChunks ?? []).map((c) => ({
      text: c.text,
      file_name: fileMap.get(c.file_id)?.file_name ?? 'Unknown',
      source_type: fileMap.get(c.file_id)?.source_type,
      metadata: { ...((c.metadata as Record<string, unknown>) ?? {}), file_id: c.file_id },
    })),
    criticalItems: criticalItems ?? [],
    timelineEvents: timelineEvents ?? [],
    projectSummary: project?.last_summary ?? null,
  };

  const chunkedFileIds = new Set((recentChunks ?? []).map((c) => c.file_id));
  const { data: extractedFiles } = await supabase
    .from('files')
    .select('id, file_name, source_type, extracted_text, status')
    .eq('project_id', projectId)
    .not('extracted_text', 'is', null)
    .in('status', ['processing', 'processed']);

  for (const file of extractedFiles ?? []) {
    if (chunkedFileIds.has(file.id)) continue;
    const extracted = file.extracted_text?.trim();
    if (!extracted) continue;
    context.chunks.push({
      text: sampleTextForAnalysis(extracted, file.file_name, 12_000),
      file_name: file.file_name,
      source_type: file.source_type,
      metadata: { file_id: file.id, indexing: file.status === 'processing' },
    });
  }

  return { project, context };
}
