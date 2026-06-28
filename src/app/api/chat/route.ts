import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEmbedding } from '@/lib/ai/openai';
import { runSunnyAgent } from '@/lib/ai/agent';
import { formatNaturalProse } from '@/lib/ai/generation-prompts';
import { retrieveForQuery, toSearchContext } from '@/lib/search/retrieve';
import { PROJECT_RETRIEVAL_LIMIT } from '@/lib/search/context-limits';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { project_id, message } = await request.json();
    if (!project_id || !message?.trim()) {
      return NextResponse.json({ error: 'Project ID and message required' }, { status: 400 });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, client_name, project_name')
      .eq('id', project_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('project_id', project_id)
      .order('created_at', { ascending: true })
      .limit(20);

    await supabase.from('chat_messages').insert({
      project_id,
      role: 'user',
      content: message,
    });

    const embedding = await createEmbedding(message);

    const [
      retrieved,
      { data: projectMeta },
      { data: criticalItems },
      { data: timelineEvents },
    ] = await Promise.all([
      retrieveForQuery(supabase, message, embedding, {
        projectId: project_id,
        limit: PROJECT_RETRIEVAL_LIMIT,
      }),
      supabase.from('projects').select('last_summary').eq('id', project_id).single(),
      supabase.from('critical_items').select('title, summary, severity').eq('project_id', project_id).eq('status', 'open').limit(5),
      supabase.from('timeline_events').select('title, description, created_at').eq('project_id', project_id).order('created_at', { ascending: false }).limit(10),
    ]);

    const context = {
      chunks: toSearchContext(retrieved),
      criticalItems: criticalItems ?? [],
      timelineEvents: timelineEvents ?? [],
      projectSummary: projectMeta?.last_summary ?? null,
    };

    const response = await runSunnyAgent({
      message,
      context,
      project,
      chatHistory: (history ?? []) as Array<{ role: 'user' | 'assistant'; content: string }>,
      supabase,
    });

    const savedAnswer =
      response.artifact?.type === 'deck'
        ? response.answer
        : formatNaturalProse(response.answer);

    await supabase.from('chat_messages').insert({
      project_id,
      role: 'assistant',
      content: savedAnswer,
      citations: response.citations,
      metadata: {
        confidence: response.confidence,
        suggested_next_step: response.suggested_next_step,
        artifact: response.artifact,
        actions_taken: response.actions_taken,
        model: response.model,
      },
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Chat error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
