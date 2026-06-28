import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generatePageBrief,
  generatePageDeck,
  generatePageFollowUpEmail,
  generatePagePlaybook,
  formatBriefAsProse,
} from '@/lib/ai/page-generation';

async function getProjectContext(projectId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
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

  return {
    project,
    context: {
      chunks: (recentChunks ?? []).map((c) => ({
        text: c.text,
        file_name: fileMap.get(c.file_id)?.file_name ?? 'Unknown',
        source_type: fileMap.get(c.file_id)?.source_type,
        metadata: c.metadata as Record<string, unknown>,
      })),
      criticalItems: criticalItems ?? [],
      timelineEvents: timelineEvents ?? [],
      projectSummary: project?.last_summary ?? null,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, type, version, instructions } = await request.json();
    if (!project_id || !type) {
      return NextResponse.json({ error: 'Project ID and type required' }, { status: 400 });
    }

    const { project, context } = await getProjectContext(project_id, supabase);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const userInstructions = typeof instructions === 'string' ? instructions : undefined;
    let content: string;
    let title: string;
    let docType: string;

    switch (type) {
      case 'brief': {
        const brief = await generatePageBrief(context, userInstructions);
        content = formatBriefAsProse(brief);
        title = `Sunny Brief — ${project.project_name}`;
        docType = 'brief';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'brief',
          title,
          content,
          citations: brief.citations,
          metadata: userInstructions ? { instructions: userInstructions } : {},
        });
        break;
      }
      case 'playbook': {
        content = await generatePagePlaybook(project.project_name, project.client_name, context, userInstructions);
        title = `Operating Playbook — ${project.client_name}`;
        docType = 'playbook';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'playbook',
          title,
          content,
          metadata: userInstructions ? { instructions: userInstructions } : {},
        });

        await supabase.from('timeline_events').insert({
          project_id,
          event_type: 'playbook',
          title: `Playbook generated: ${project.client_name}`,
          description: 'Sunny generated an operating playbook',
        });
        break;
      }
      case 'follow_up_email': {
        content = await generatePageFollowUpEmail(
          project.project_name,
          project.client_name,
          context,
          version ?? 'detailed',
          userInstructions
        );
        title = `Follow-Up Email — ${project.client_name}`;
        docType = 'follow_up_email';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'follow_up_email',
          title,
          content,
          metadata: { version: version ?? 'detailed', ...(userInstructions ? { instructions: userInstructions } : {}) },
        });

        await supabase.from('timeline_events').insert({
          project_id,
          event_type: 'follow_up_email',
          title: `Follow-up email drafted: ${project.client_name}`,
          description: `${version ?? 'detailed'} version`,
        });
        break;
      }
      case 'deck': {
        content = await generatePageDeck(
          project.project_name,
          project.client_name,
          context,
          userInstructions
        );
        title = `Presentation Deck — ${project.client_name}`;
        docType = 'deck';

        await supabase.from('generated_documents').insert({
          project_id,
          type: 'memo',
          title,
          content,
          metadata: { doc_kind: 'deck', ...(userInstructions ? { instructions: userInstructions } : {}) },
        });

        await supabase.from('timeline_events').insert({
          project_id,
          event_type: 'note',
          title: `Deck generated: ${project.client_name}`,
          description: userInstructions ?? 'Presentation deck created from project materials',
        });
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ data: { title, content, type: docType } });
  } catch (error) {
    console.error('Generate error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
