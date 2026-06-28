import { createClient } from '@/lib/supabase/server';
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
      metadata: c.metadata as Record<string, unknown>,
    })),
    criticalItems: criticalItems ?? [],
    timelineEvents: timelineEvents ?? [],
    projectSummary: project?.last_summary ?? null,
  };

  return { project, context };
}
